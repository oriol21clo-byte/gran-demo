import bpy,json,math,os,copy
from mathutils import Vector
from pathlib import Path
OUT=Path('work/mode-study/renders');OUT.mkdir(exist_ok=True)
def rgb(hex):
 h=hex.lstrip('#');return tuple(((int(h[i:i+2],16)/255+.055)/1.055)**2.4 if int(h[i:i+2],16)/255>.04045 else int(h[i:i+2],16)/255/12.92 for i in (0,2,4))
styles={
'npm':[
 ('01','Фарфор','#dce3e8','#d7d4cd','#647585',.65,(1,.94,.85),55),
 ('02','Холодный гипс','#e3e9ef','#bac9d5','#59748d',.55,(.82,.91,1),45),
 ('03','Тёплый камень','#ece5d9','#c9bca7','#897759',.48,(1,.85,.67),38),
 ('04','Графитовый макет','#e2e6eb','#566578','#3b5570',.6,(.85,.92,1),55),
 ('05','Белая бумага','#eff1f4','#e2e5e8','#426391',.45,(1,1,1),32)],
'vpm':[
 ('01','Тёплый дневной','#e9e4db',None,None,.5,(1,.89,.73),55),
 ('02','Мягкий золотой час','#eee4d4',None,None,.38,(1,.71,.43),32),
 ('03','Графитовая студия','#273748',None,None,.45,(1,.87,.67),45),
 ('04','Синий час','#253e59',None,None,.42,(1,.76,.48),35),
 ('05','Архитектурный баланс','#e3e9ee',None,None,.6,(1,.87,.68),65)],
'cim':[
 ('01','Светлый технический','#e8edf2',None,None,.65,(1,.97,.91),75),
 ('02','Ледяное стекло','#e0e9f0',None,None,.65,(.82,.93,1),80),
 ('03','Цвет разделов','#f0edf3',None,None,.65,(1,.96,1),75),
 ('04','Конструкция и связи','#e9e9e4',None,None,.6,(1,.92,.79),60),
 ('05','Тёмный технический','#25394d',None,None,.5,(.8,.91,1),65)]}
def material(name,color,rough=.85,metal=0,opacity=1):
 m=bpy.data.materials.new(name);m.use_nodes=True;nodes=m.node_tree.nodes;bs=nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
 if name.startswith('bim'):
  bs.inputs['Emission Color'].default_value=(*color,1);bs.inputs['Emission Strength'].default_value=.35
 if opacity<1:
  trans=nodes.new('ShaderNodeBsdfTransparent');mix=nodes.new('ShaderNodeMixShader');mix.inputs[0].default_value=opacity;links=m.node_tree.links;links.new(trans.outputs[0],mix.inputs[1]);links.new(bs.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],nodes.get('Material Output').inputs[0])
 return m
for mode,options in styles.items():
 if os.getenv('STUDY_MODES') and mode not in os.getenv('STUDY_MODES').split(','):continue
 data=json.load(open('work/mode-study/'+mode+'.json'))
 # Union coplanar context road/walk rectangles; identical footprint, no overlapping faces.
 for level in (.03,.04):
  planes=[o for o in data if o['role']=='context' and not o['line'] and len(o['verts'])==4 and all(abs(v[2]-level)<1e-5 for v in o['verts'])]
  if not planes:continue
  rects=[(min(v[0] for v in o['verts']),max(v[0] for v in o['verts']),min(v[1] for v in o['verts']),max(v[1] for v in o['verts'])) for o in planes]
  xs=sorted(set(a for r in rects for a in r[:2]));ys=sorted(set(a for r in rects for a in r[2:]));data=[o for o in data if o not in planes]
  for x0,x1 in zip(xs,xs[1:]):
   for y0,y1 in zip(ys,ys[1:]):
    cx,cy=(x0+x1)/2,(y0+y1)/2
    if any(a<=cx<=b and c<=cy<=d for a,b,c,d in rects):
     o=copy.deepcopy(planes[0]);o['verts']=[[x0,y0,level],[x1,y0,level],[x1,y1,level],[x0,y1,level]];o['idx']=[0,1,2,0,2,3];data.append(o)
 for idx,(code,title,bg,body,edge,ambient,light,size) in enumerate(options):
  if os.getenv('STUDY_TEST') and (mode!=os.getenv('TEST_MODE','npm') or idx!=0):continue
  bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
  for m in list(bpy.data.materials):
   if m.users==0:bpy.data.materials.remove(m)
  scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=8 if os.getenv('STUDY_TEST') else (32 if mode=='cim' else 48);scene.cycles.use_denoising=False;scene.cycles.transparent_max_bounces=64;scene.cycles.max_bounces=6;scene.cycles.diffuse_bounces=2;scene.cycles.glossy_bounces=2
  scene.render.resolution_x=450 if os.getenv('STUDY_TEST') else 900;scene.render.resolution_y=360 if os.getenv('STUDY_TEST') else 720;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.view_settings.exposure=-.25
  world=bpy.data.worlds.new('world');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(*rgb(bg),1);world.node_tree.nodes['Background'].inputs[1].default_value=ambient;scene.world=world
  batches={};lines={}
  for o in data:
   col=tuple(o['color']);op=o['opacity'];role=o['role'];line=o['line'];ctx=role=='context'
   if ctx:
    # Context stays subordinate; colors derived from original scene luminance.
    lum=sum(col)/3
    col=rgb('#a7b2c1' if lum<.3 else '#d5dce5' if lum<.65 else '#eff2f5')
    if mode=='vpm' and idx in (2,3) or mode=='cim' and idx==4:
     col=tuple(v*.28 for v in col)
    if line:op=.15
   elif mode=='npm':
    if line:
     # Keep silhouette only, omit original floor-marker lines.
     if len(o['idx'])>30:continue
     if idx!=4:continue
     col=rgb(edge);op=.5
    else:col=rgb(body);op=1
   elif mode=='vpm':
    # Reduce candy greens and give glazing a clear, darker read.
    if col[1]>col[0]*1.25 and col[1]>col[2]*1.25:col=tuple(c*.75 for c in col)
    if max(col)-min(col)<.04 and max(col)>.75:col=rgb('#e3e2dc')
   elif mode=='cim':
    if role in ('cim','cimAR'):
     if line:col=rgb(['#6f9bbb','#719fbd','#917fa9','#a1a8af','#85b8d1'][idx]);op=[.4,.32,.4,.18,.45][idx]
     elif op<.15:op=[.018,.027,.018,.008,.025][idx];col=rgb(['#b1d1e3','#addcf2','#c4b6dd','#bdcbd5','#8bbbd5'][idx])
     elif op<.6:col=rgb(['#70a88b','#83b39c','#6da08b','#91a898','#66b79e'][idx]);op=.22
    if role=='cimPS':col=rgb('#c78a46');op=.65 if line else .12
    if role=='cimBIO':col=rgb('#6b9d82');op=.2 if not line else .5
    if role=='bimSlab':col=rgb(['#a4afb9','#a7bdce','#b3a3c8','#8d9aa5','#7897ab'][idx]);op=[.34,.25,.3,.5,.3][idx]
    if role=='bimWall':col=rgb(['#bcb5a7','#b5c2c7','#b0a6bc','#b0b4b1','#9faec0'][idx]);op=.48
    if role=='bimCore':col=rgb(['#718092','#7497b0','#8c79a2','#697b8c','#698eab'][idx])
    if role in ('bimDuct','bimWater'):col=rgb('#368fca')
    if role=='bimStair':col=rgb('#d69b45')
    if role=='bimPipe':col=rgb('#c96b65')
    if role=='bimExh':col=rgb('#76a287')
    if role in ('bimTray','bimCab'):col=rgb('#c4a44f')
   key=(col,round(op,3),role,line)
   if line:
    if op<.1:continue
    segs=lines.setdefault(key,[]);ii=o['idx'];step=2 if o['segments'] else 1
    for i in range(0,len(ii)-1,step):segs.append([o['verts'][ii[i]],o['verts'][ii[i+1]]])
   else:
    b=batches.setdefault(key,[[],[]]);n=len(b[0]);b[0].extend(o['verts']);b[1].extend(tuple(n+j for j in o['idx'][i:i+3]) for i in range(0,len(o['idx']),3))
  for key,(verts,faces) in batches.items():
   col,op,role,_=key;mesh=bpy.data.meshes.new('original-geometry');mesh.from_pydata(verts,[],faces);mesh.update();obj=bpy.data.objects.new(role or mode,mesh);scene.collection.objects.link(obj);obj.data.materials.append(material(role or mode,col,opacity=op));obj.visible_shadow=mode!='cim' and role!='context' and op>.65
  for key,segs in lines.items():
   col,op,role,_=key;curve=bpy.data.curves.new('technical-lines','CURVE');curve.dimensions='3D';curve.resolution_u=1;curve.bevel_depth=.025 if mode!='npm' else .018;curve.bevel_resolution=0
   for a,b in segs:
    sp=curve.splines.new('POLY');sp.points.add(1);sp.points[0].co=(*a,1);sp.points[1].co=(*b,1)
   obj=bpy.data.objects.new('silhouette',curve);scene.collection.objects.link(obj);curve.materials.append(material('line',col,opacity=op))
  def area(name,loc,power,color,size):
   bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.name=name;l.data.energy=power;l.data.color=color;l.data.shape='DISK';l.data.size=size;l.rotation_euler=(Vector((0,0,20))-l.location).to_track_quat('-Z','Y').to_euler()
  area('key',(-80,-100,140 if idx!=1 else 85),600000 if mode!='cim' else 350000,light,size)
  area('fill',(100,50,110),350000 if mode=='vpm' and idx in (2,3) else 120000,(.62,.8,1),70)
  bpy.ops.object.camera_add(location=(120,-145,110));cam=bpy.context.object;target=Vector((0,0,25));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=137;scene.camera=cam
  scene.render.filepath=str((OUT/(mode+'-'+code+'.png')).resolve());bpy.ops.render.render(write_still=True);print('FINISHED',mode,code,flush=True)
print('ALL FINISHED',flush=True)

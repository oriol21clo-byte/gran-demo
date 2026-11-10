import bpy,json,math,os,random,time,gzip,sys
from pathlib import Path
from mathutils import Matrix,Vector
ROOT=str(Path(__file__).resolve().parents[2])
data=json.load(gzip.open(ROOT+'/review/blender-studies/model.json.gz','rt'))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=64;scene.cycles.use_denoising=False;scene.cycles.adaptive_threshold=.055
scene.cycles.max_bounces=5;scene.cycles.diffuse_bounces=3;scene.cycles.glossy_bounces=3;scene.cycles.transmission_bounces=3
scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
# Batch existing mesh instances by material; identical geometry, Y-up -> Z-up.
buckets={};glass_mats=[];allm=[]
for i,desc in enumerate(data['materials']):
 m=bpy.data.materials.new('Glass' if desc['glass'] else 'Facade_%02d'%i);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*desc['color'],1);p.inputs['Roughness'].default_value=.22 if desc['glass'] else max(.35,desc['roughness']);p.inputs['Metallic'].default_value=.25 if desc['glass'] else desc['metalness'];p.inputs['Coat Weight'].default_value=.4 if desc['glass'] else .1
 allm.append(m)
 if desc['glass']:
  for lit in range(3):
   n=m.copy();n.name='Window_%02d_%d'%(i,lit);glass_mats.append((n,lit));buckets[(i,lit)]={'verts':[],'faces':[],'mat':n}
 else:buckets[(i,0)]={'verts':[],'faces':[],'mat':m}
for oi,o in enumerate(data['objects']):
 desc=data['materials'][o['m']];a=o['matrix'];M=Matrix([a[k:k+4] for k in range(0,16,4)]).transposed();g=data['geometries'][o['g']];pos=g['positions'];idx=g['index'] or list(range(len(pos)//3))
 # Deterministic, sparse occupancy per window instance rather than all windows glowing.
 key=(oi*1664525+1013904223)%100;lit=0 if key<62 else 1 if key<87 else 2
 B=buckets[(o['m'],lit if desc['glass'] else 0)];offset=len(B['verts'])
 for j in range(0,len(pos),3):
  q=M@Vector(pos[j:j+3]);B['verts'].append((q.x,-q.z,q.y))
 B['faces'].extend(tuple(offset+idx[j+k] for k in range(3)) for j in range(0,len(idx),3))
for key,B in buckets.items():
 if not B['verts']:continue
 mesh=bpy.data.meshes.new('Geometry_%s'%str(key));mesh.from_pydata(B['verts'],[],B['faces']);mesh.update();obj=bpy.data.objects.new('Project_%s'%str(key),mesh);scene.collection.objects.link(obj);obj.data.materials.append(B['mat'])
# Ground receiving real indirect light and soft contact shadows.
bpy.ops.mesh.primitive_plane_add(size=3000,location=(0,0,-1.23));floor=bpy.context.object;floor.name='Studio ground';fm=bpy.data.materials.new('Ground');fm.use_nodes=True;fp=fm.node_tree.nodes.get('Principled BSDF');fp.inputs['Roughness'].default_value=.83;floor.data.materials.append(fm)
# Same camera for every study.
bpy.ops.object.camera_add(location=(-172,190,145));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,35))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=205;scene.camera=cam
world=bpy.data.worlds.new('Atmosphere');world.use_nodes=True;scene.world=world;bg=world.node_tree.nodes.get('Background')
def light(name,kind,pos,target,energy,color,size=15):
 d=bpy.data.lights.new(name,kind);d.energy=energy;d.color=color
 if kind=='AREA':d.shape='DISK';d.size=size
 if kind=='SUN':d.angle=math.radians(7)
 o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o
sun=light('Daylight','SUN',(-100,80,160),(0,0,0),3,(1,.93,.83))
washes=[light('Facade wash','AREA',(-75,72,24),(-15,0,36),0,(1,.65,.32),32),light('Facade rim','AREA',(80,-35,28),(0,0,35),0,(.55,.72,1),28)]
lamps=[light('Garden light','POINT',(x,48,3),(x,48,0),0,(1,.58,.25)) for x in [-50,-30,-10,10,30,50]]
for l in lamps:l.data.shadow_soft_size=1.4
profiles=[
 {'name':'01 Mineral','day_world':(.58,.68,.8),'day_ground':(.55,.59,.62),'day_sun':(1,.94,.85),'sun':3.0,'night_world':(.055,.085,.15),'night_ground':(.09,.13,.18),'warm':(1,.69,.37),'washes':(65000,45000),'emission':2.6},
 {'name':'02 Warm','day_world':(.7,.73,.78),'day_ground':(.61,.55,.46),'day_sun':(1,.76,.5),'sun':2.7,'night_world':(.1,.075,.09),'night_ground':(.14,.11,.1),'warm':(1,.52,.2),'washes':(72000,25000),'emission':2.4},
 {'name':'03 Gallery','day_world':(.48,.59,.75),'day_ground':(.45,.51,.59),'day_sun':(.85,.93,1),'sun':3.8,'night_world':(.025,.045,.085),'night_ground':(.045,.065,.1),'warm':(1,.78,.48),'washes':(85000,65000),'emission':3.4}
]
selected=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
for i,P in enumerate(profiles,1):
 if selected and str(i) not in selected:continue
 for mode in ['day','night']:
  night=mode=='night';bg.inputs['Color'].default_value=(*(P['night_world'] if night else P['day_world']),1);bg.inputs['Strength'].default_value=.2 if night else .48
  fp.inputs['Base Color'].default_value=(*(P['night_ground'] if night else P['day_ground']),1)
  sun.data.energy=.16 if night else P['sun'];sun.data.color=(.45,.62,1) if night else P['day_sun']
  for j,w in enumerate(washes):w.data.energy=P['washes'][j] if night else 0;w.data.color=P['warm'] if j==0 else (.5,.66,1)
  for l in lamps:l.data.energy=180 if night else 0
  for m,lit in glass_mats:
   p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=(*(P['warm'] if lit==1 else (1,.86,.63)),1);p.inputs['Emission Strength'].default_value=(P['emission']*(1 if lit==1 else .6)) if night and lit else 0
   p.inputs['Roughness'].default_value=.24 if night else .17
  scene.view_settings.exposure=.1 if night else -.3
  scene.render.filepath=ROOT+'/review/blender-studies/%d-%s.png'%(i,mode)
  print('STUDY_START',i,mode,flush=True);bpy.ops.render.render(write_still=True);print('STUDY_DONE',i,mode,flush=True)
# Keep a compact, editable scene; variants are reproducible from this script.
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/work/blender/gran-lighting.blend',compress=True)

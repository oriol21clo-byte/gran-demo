from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
OUT=Path('design/mode-study');SRC=Path('work/mode-study/renders');(OUT/'views').mkdir(exist_ok=True)
F='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';FB='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def font(n,b=False):return ImageFont.truetype(FB if b else F,n)
styles={'npm':['Фарфор','Холодный гипс','Тёплый камень','Графитовый макет','Белая бумага'],'vpm':['Тёплый дневной','Мягкий золотой час','Графитовая студия','Синий час','Архитектурный баланс'],'cim':['Светлый технический','Ледяное стекло','Цвет разделов','Конструкция и связи','Тёмный технический']}
mode_names={'npm':'НПМ','vpm':'ВПМ','cim':'ЦИМ IFC'}
for mode,names in styles.items():
 frames=[]
 for i,name in enumerate(names,1):
  p=SRC/f'{mode}-{i:02}.png'
  if not p.exists():continue
  im=Image.open(p).convert('RGB')
  w,h=im.size;frame=Image.new('RGB',(w,h+150),'#f4f5f7');d=ImageDraw.Draw(frame)
  d.text((24,17),f'{mode_names[mode]} / {i:02} · {name}',font=font(23,True),fill='#192431')
  d.rounded_rectangle((12,64,w-12,h+138),radius=14,fill='#e6ebf0',outline='#c5cdd8',width=1)
  im=im.resize((w-26,h-22),Image.Resampling.LANCZOS);frame.paste(im,(13,110));d=ImageDraw.Draw(frame)
  x=24
  for key,label,accent in [('npm','НПМ','#437fc7'),('vpm','ВПМ','#ba792d'),('cim','ЦИМ IFC','#7453b3')]:
   bw=150 if key=='cim' else 103
   d.rounded_rectangle((x,72,x+bw,111),radius=7,fill='#131b25' if key==mode else '#ffffff',outline='#c6cfdb')
   d.rounded_rectangle((x+13,88,x+21,96),radius=1,fill=accent);d.text((x+30,80),label,font=font(16,True),fill='#ffffff' if key==mode else '#647281');x+=bw+4
  d.rounded_rectangle((w-234,74,w-24,109),radius=6,fill='#ffffff',outline='#d7dde6');d.text((w-221,83),'ГРАНЬ · концепция',font=font(14),fill='#3d5d82')
  # Footer is explanatory rather than a claim about export/file validation.
  texts={'npm':['FBX · макет масс','Без фасадной детализации'],'vpm':['FBX · PBR','Фасады и благоустройство'],'cim':['IFC · техническая подача','Конструкции и инженерия']}
  d.rounded_rectangle((26,h+46,366,h+123),radius=8,fill='#fffffff0' if False else '#ffffff',outline='#d5dde8')
  for j,line in enumerate(texts[mode]):d.text((42,h+59+27*j),line,font=font(16,j==0),fill='#284c77' if j==0 else '#687888')
  if mode=='cim':
   for j,(label,color) in enumerate([('АР','#6a8fb8'),('ПС','#c98c42'),('БиО','#6c9d85')]):
    x=30+j*98;d.rounded_rectangle((x,126,x+87,158),radius=6,fill='#ffffff',outline='#d3dce7');d.rectangle((x+9,138,x+16,145),fill=color);d.text((x+24,132),label,font=font(14),fill='#3a536d')
  d.text((w-244,h+69),'Статичный концепт-рендер',font=font(14),fill='#697c90')
  target=OUT/'views'/f'{mode}-{i:02}.jpg';frame.save(target,quality=93);frames.append(frame)
 if len(frames)==5:
  sheet=Image.new('RGB',(1280,2040),'#f4f5f7');d=ImageDraw.Draw(sheet);d.text((20,20),f'ГРАНЬ / {mode_names[mode]} — пять направлений',font=font(28,True),fill='#192431');d.text((20,65),'Сохраняем назначение модели. Меняем только визуальную подачу.',font=font(17),fill='#697788')
  for n,frame in enumerate(frames):
   frame.thumbnail((620,635));sheet.paste(frame,(10+(n%2)*640,110+(n//2)*640))
  y=1430;d.text((675,y),'Назначение сохраняется',font=font(23,True),fill='#192431')
  notes={'npm':['Однотонные массы.','Без окон и текстур фасада.','Условное окружение.','Свет, тон и силуэт.'],'vpm':['Полноценная архитектура.','Фасады и остекление.','Деревья и благоустройство.','Тёплые и тёмные сцены.'],'cim':['Полупрозрачная оболочка.','Этажи и конструкции.','Цветовая иерархия систем.','Читаемость внутренней модели.']}
  for j,t in enumerate(notes[mode]):d.text((675,y+58+j*36),t,font=font(20),fill='#697788')
  d.text((675,y+260),'Не внедрено в основной сайт.',font=font(17),fill='#697788');sheet.save(OUT/f'{mode}-sheet.jpg',quality=92)

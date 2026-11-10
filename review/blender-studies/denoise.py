from PIL import Image
import numpy as np,subprocess,pathlib,sys
root=pathlib.Path(__file__).resolve().parents[2]
for path in map(pathlib.Path,sys.argv[1:]):
 a=np.array(Image.open(path).convert('RGB'),dtype=np.float32)/255
 h,w,_=a.shape;src=root/'work/blender/noisy.pfm';dst=root/'work/blender/clean.pfm'
 with src.open('wb') as f:f.write(f'PF\n{w} {h}\n-1.0\n'.encode());np.flipud(a).astype('<f4').tofile(f)
 subprocess.run([str(root/'work/blender/oidn-2.5.1.x86_64.linux/bin/oidnDenoise'),'--ldr',str(src),'--srgb','--quality','high','--threads','2','--maxmem','1024','-o',str(dst)],check=True)
 with dst.open('rb') as f:
  f.readline();ww,hh=map(int,f.readline().split());f.readline();clean=np.fromfile(f,dtype='<f4').reshape(hh,ww,3)
 Image.fromarray(np.uint8(np.clip(np.flipud(clean)*255,0,255))).save(path)

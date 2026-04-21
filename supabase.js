const SUPA_URL = 'https://ofyovgtadkulndlmuqbi.supabase.co';
const SUPA_KEY = 'sb_publishable_muz_cdqLE4UUQRYw5gwt_g_ACpnT59l';
const db = supabase.createClient(SUPA_URL, SUPA_KEY);

let inventario = [], ventas = {}, destinos = [], activeDestinoId = null, catalogo = {};
let pendingCatItem = null, pendingEditId = null;

// ── HELPER: render imagen con placeholder ──────────────────
function imgTag(url, cls='') {
  if (!url) return '';
  return `<img src="${esc(url)}" class="${cls}" alt="" loading="lazy"
    onload="this.style.opacity=1"
    onerror="this.style.display='none'"
    style="opacity:0;transition:opacity .3s">`;
}

// ── IMAGEN: redimensionar y subir a Supabase Storage ──────
function uploadImageToStorage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(600 / img.width, 600 / img.height, 1);
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          const fileName = `producto_${Date.now()}.jpg`;
          const { error } = await db.storage
            .from('productos')
            .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
          if (error) { reject(error); return; }
          const { data } = db.storage.from('productos').getPublicUrl(fileName);
          resolve(data.publicUrl);
        }, 'image/jpeg', 0.82);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── UTILS ──────────────────────────────────────────────────
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function getDestinoIcon(n){const l=n.toLowerCase();if(l.includes('spotify')||l.includes('musi'))return'🎵';if(l.includes('internet')||l.includes('wifi'))return'📱';if(l.includes('luz'))return'💡';if(l.includes('agua'))return'💧';if(l.includes('comida')||l.includes('mercado'))return'🍕';if(l.includes('pasaje')||l.includes('bus'))return'🚌';if(l.includes('ahorro')||l.includes('banco'))return'💰';if(l.includes('netflix')||l.includes('cine'))return'🎬';if(l.includes('alquiler')||l.includes('casa'))return'🏠';if(l.includes('salud')||l.includes('medic'))return'🏥';return'🎯';}

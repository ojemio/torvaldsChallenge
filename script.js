/* script.js - Digital Business Card Generator
   Pure client-side: builds vCard, generates QR, shows preview, exports PDF and .vcf
*/

// Elements
const form = document.getElementById('cardForm');
const generateBtn = document.getElementById('generateBtn');
const downloadPDFBtn = document.getElementById('downloadPDFBtn');
const downloadVCardBtn = document.getElementById('downloadVCardBtn');
const saveLocalBtn = document.getElementById('saveLocalBtn');
const templateSelect = document.getElementById('templateSelect');
const logoInput = document.getElementById('logoInput');

const pName = document.getElementById('pName');
const pRole = document.getElementById('pRole');
const pCompany = document.getElementById('pCompany');
const pPhone = document.getElementById('pPhone');
const pEmail = document.getElementById('pEmail');
const logoHolder = document.getElementById('logoHolder');
const businessCard = document.getElementById('businessCard');
const qrcodeContainer = document.getElementById('qrcode');
const savedCardsList = document.getElementById('savedCardsList');

let qr; // QRCode instance
let currentVCard = ''; // keep last vCard
let currentLogoDataUrl = null;

// Build vCard string (vCard 3.0 compatible)
function buildVCard({fullName, company, role, phone, email}){
  // Normalize values and escape commas/semicolons
  const esc = s => (s||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  const lines = [];
  lines.push('BEGIN:VCARD');
  lines.push('VERSION:3.0');
  lines.push(`FN:${esc(fullName)}`);
  if (company) lines.push(`ORG:${esc(company)}`);
  if (role) lines.push(`TITLE:${esc(role)}`);
  if (phone) lines.push(`TEL;TYPE=CELL:${esc(phone)}`);
  if (email) lines.push(`EMAIL;TYPE=INTERNET:${esc(email)}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

// Render QR code from vCard
function renderQRCode(vcard){
  qrcodeContainer.innerHTML = '';
  // qrcode.js creates a canvas or table inside the container
  qr = new QRCode(qrcodeContainer, {
    text: vcard,
    width: 120,
    height: 120,
    colorDark : '#000000',
    colorLight : '#ffffff',
    correctLevel : QRCode.CorrectLevel.H // high error correction for logo overlays
  });
}

// Update card preview
function updatePreview(data){
  pName.textContent = data.fullName || 'Full Name';
  pRole.textContent = data.role || 'Role / Title';
  pCompany.textContent = data.company || 'Company';
  pPhone.textContent = data.phone || 'Phone';
  pEmail.textContent = data.email || 'Email';

  // Template
  businessCard.className = 'card ' + (data.template || 'clean');

  // Logo handling
  logoHolder.innerHTML = '';
  if (currentLogoDataUrl){
    const img = document.createElement('img');
    img.src = currentLogoDataUrl;
    img.alt = 'logo';
    logoHolder.appendChild(img);
  } else {
    logoHolder.textContent = data.fullName ? (data.fullName.split(' ').map(n=>n[0]||'').slice(0,2).join('')) : '';
  }
}

// Validate minimal fields
function validateForm(data){
  if (!data.fullName) return 'Full Name is required.';
  if (!data.phone) return 'Phone Number is required.';
  // basic email pattern if present
  if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) return 'Email seems invalid.';
  return null;
}

// Convert card DOM to PDF
async function exportCardToPDF(){
  // Use html2canvas to capture the card
  const node = businessCard;
  const canvas = await html2canvas(node, {scale:2, useCORS:true, backgroundColor: null});
  const imgData = canvas.toDataURL('image/png');

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({orientation: 'landscape', unit: 'pt', format: [canvas.width, canvas.height]});
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save((document.getElementById('fullName').value || 'business-card') + '.pdf');
}

// Download vCard file
function downloadVCardFile(vcard, filename){
  const blob = new Blob([vcard], {type:'text/vcard'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'contact.vcf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Read logo/file input as data URL
logoInput.addEventListener('change', (e)=>{
  const f = e.target.files[0];
  if (!f) { currentLogoDataUrl = null; return; }
  const reader = new FileReader();
  reader.onload = ()=>{ currentLogoDataUrl = reader.result; };
  reader.readAsDataURL(f);
});

// Save card to localStorage (simple storage)
function saveCardToLocal(data){
  const list = JSON.parse(localStorage.getItem('dbc_saved')||'[]');
  const id = Date.now();
  list.push({id, created: new Date().toISOString(), data, logo: currentLogoDataUrl});
  localStorage.setItem('dbc_saved', JSON.stringify(list));
  renderSavedList();
}

function renderSavedList(){
  const list = JSON.parse(localStorage.getItem('dbc_saved')||'[]');
  savedCardsList.innerHTML = '';
  list.slice().reverse().forEach(item=>{
    const li = document.createElement('li');
    li.textContent = item.data.fullName + ' — ' + (item.data.company||'');
    const actions = document.createElement('div');
    actions.style.display='flex'; actions.style.gap='6px';
    const loadBtn = document.createElement('button');
    loadBtn.className='small-btn'; loadBtn.textContent='Load';
    loadBtn.onclick = ()=>{ loadSavedCard(item); };
    const delBtn = document.createElement('button');
    delBtn.className='small-btn'; delBtn.textContent='Delete';
    delBtn.onclick = ()=>{ deleteSavedCard(item.id); };
    actions.appendChild(loadBtn); actions.appendChild(delBtn);
    li.appendChild(actions);
    savedCardsList.appendChild(li);
  });
}

function loadSavedCard(item){
  const d = item.data;
  document.getElementById('fullName').value = d.fullName || '';
  document.getElementById('company').value = d.company || '';
  document.getElementById('role').value = d.role || '';
  document.getElementById('phone').value = d.phone || '';
  document.getElementById('email').value = d.email || '';
  templateSelect.value = d.template || 'clean';
  currentLogoDataUrl = item.logo || null;
  // rebuild immediately
  generateBtn.click();
}

function deleteSavedCard(id){
  const list = JSON.parse(localStorage.getItem('dbc_saved')||'[]');
  const filtered = list.filter(i=>i.id!==id);
  localStorage.setItem('dbc_saved', JSON.stringify(filtered));
  renderSavedList();
}

// Event: Generate Card
generateBtn.addEventListener('click', ()=>{
  const data = {
    fullName: document.getElementById('fullName').value.trim(),
    company: document.getElementById('company').value.trim(),
    role: document.getElementById('role').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    template: templateSelect.value
  };
  const err = validateForm(data);
  if (err){ alert(err); return; }

  // Build vCard and render QR
  currentVCard = buildVCard(data);
  renderQRCode(currentVCard);
  updatePreview(data);
});

// Download PDF
downloadPDFBtn.addEventListener('click', async ()=>{
  if (!currentVCard) { alert('Generate the card first.'); return; }
  await exportCardToPDF();
});

// Download vCard file
downloadVCardBtn.addEventListener('click', ()=>{
  if (!currentVCard){ alert('Generate the card first.'); return; }
  const name = document.getElementById('fullName').value.trim() || 'contact';
  downloadVCardFile(currentVCard, (name + '.vcf'));
});

// Save locally
saveLocalBtn.addEventListener('click', ()=>{
  const data = {
    fullName: document.getElementById('fullName').value.trim(),
    company: document.getElementById('company').value.trim(),
    role: document.getElementById('role').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    template: templateSelect.value
  };
  const err = validateForm(data);
  if (err){ alert(err); return; }
  saveCardToLocal(data);
  alert('Saved locally.');
});

// Load saved on start
renderSavedList();

// Small nicety: allow pressing Enter in form to generate
form.addEventListener('submit', (e)=>{ e.preventDefault(); generateBtn.click(); });

// Initialize default sample
(function initSample(){
  document.getElementById('fullName').value = 'Ada Lovelace';
  document.getElementById('company').value = 'Analytical Engines Inc.';
  document.getElementById('role').value = 'Software Engineer';
  document.getElementById('phone').value = '+1 555 123 4567';
  document.getElementById('email').value = 'ada@example.com';
  generateBtn.click();
})();

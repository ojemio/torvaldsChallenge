// script.js - pure vanilla JavaScript


const form = document.getElementById('cardForm');
const generateBtn = document.getElementById('generateBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const saveLocalBtn = document.getElementById('saveLocalBtn');
const loadLocalBtn = document.getElementById('loadLocalBtn');


const pvName = document.getElementById('pvName');
const pvTitle = document.getElementById('pvTitle');
const pvCompany = document.getElementById('pvCompany');
const pvPhone = document.getElementById('pvPhone');
const pvEmail = document.getElementById('pvEmail');
const qrcodeEl = document.getElementById('qrcode');
const businessCard = document.getElementById('businessCard');
const logoInput = document.getElementById('logoInput');
const logoPlaceholder = document.getElementById('logoPlaceholder');
const templateSelect = document.getElementById('template');
const savedCardsList = document.getElementById('savedCards');


let currentQr = null;
let currentData = null;
let logoDataUrl = null;


function buildVCard({fullName, company, title, phone, email}){
// Minimal vCard 3.0
const lines = [
'BEGIN:VCARD',
'VERSION:3.0',
`FN:${escapeV(fullName)}`,
title ? `TITLE:${escapeV(title)}` : '',
company ? `ORG:${escapeV(company)}` : '',
phone ? `TEL;TYPE=WORK,VOICE:${escapeV(phone)}` : '',
email ? `EMAIL;TYPE=INTERNET:${escapeV(email)}` : '',
'END:VCARD'
];
return lines.filter(Boolean).join('\r\n');
}


function escapeV(s){
if(!s) return '';
return String(s).replace(/\n/g,'\\n').replace(/,/g,'\\,');
}


function generateQRCode(text){
qrcodeEl.innerHTML = '';
// QRCode.js creates a div > img or table
new QRCode(qrcodeEl, {
text: text,
width: 110,
height: 110,
correctLevel: QRCode.CorrectLevel.H
n });
}


function updatePreview(data){
pvName.textContent = data.fullName || 'Full Name';
pvTitle.textContent = data.title || '';
pvCompany.textContent = data.company || '';
pvPhone.textContent = data.phone || '';
pvEmail.textContent = data.email || '';


// template
businessCard.className = 'card ' + (data.template || 'clean');


// logo
if(logoDataUrl){
if(!list.length){ savedCardsList.innerHTML = '<li><em>No saved cards</em></
// src/productData.js

// --- Placeholder Images (Replace with actual paths later) ---
/*const placeholderBaseUrl = 'https://via.placeholder.com/';
const stampPlaceholder = `${placeholderBaseUrl}150x50/cccccc/808080?text=Stamp`;
const logDiagramPlaceholder = `${placeholderBaseUrl}250x250/cccccc/808080?text=Log+Diagram`;
const pefcLogoPlaceholder = `${placeholderBaseUrl}100x50/cccccc/808080?text=PEFC`;*/

const placeholderBaseUrl = 'https://picsum.photos/'; // Use Picsum base URL
// Add random query parameter to potentially get different images on refresh during dev
const stampPlaceholder = `${placeholderBaseUrl}150/50?random=1`;
const logDiagramPlaceholder = `${placeholderBaseUrl}250/250?grayscale?random=2`; // Example: grayscale
const pefcLogoPlaceholder = `${placeholderBaseUrl}100/50?blur=1&random=3`;

export const productList = [
    { id: 'gran-sidobrador', name: 'Gran Sidobrädor' },
    { id: 'furu-sidobrador', name: 'Furu Sidobrädor' },
    { id: 'gran-stambrador', name: 'Gran Stambrädor' },
    { id: 'furu-stambrador', name: 'Furu Stambrädor' },
    { id: 'furu-massiva-amnen', name: 'Furu Massiva Ämnen' },
    { id: 'kantade-furusidobrador', name: 'Kantade Furusidobrädor' },
];

export const productDetails = {
  'gran-sidobrador': {
    id: 'gran-sidobrador',
    name: 'Gran Sidobrädor',
    qualityDescriptor: 'Bästa kvalitet',
    stampImage: stampPlaceholder, // Replace with actual path/URL later
    logDiagramImage: logDiagramPlaceholder, // Replace with actual path/URL later
    pdfUrl: '#', // Replace with actual PDF path later
    certification: 'PEFC',
    certificationLogo: pefcLogoPlaceholder, // Replace later
    specs: [
      { label: 'Råvara', value: 'Vinteravverkad Rotstock från de bästa grandistrikten i Skandinavien' },
      { label: 'Produktion', value: 'Sågad i Ramsåg' },
      { label: 'Torkning', value: 'Lufttorkat / kammartorkat' },
      { label: 'Fuktkvot', value: 'Skeppnings torrt ca: 16 % +-2%, Special torkning: ca: 10 % +-2%' },
      { label: 'Sortering', value: 'Synat och kvalitetsbestämt enligt följande efter torkning: 16-32 mm prima kvalitet, 38-50 mm prima kvalitet ink. ca 10% B-kvalitet. Sämre kvalitet utsorteras.' },
      { label: 'Mätning', value: 'Varje stycke märkes med svart krita bredd & längd. Längdmarkering: 30:30 cm. Breddmarkering: 1:1 cm mitt mätt på plankans smala sida. Paketspecifikation medföljer.' },
      { label: 'Märkning', value: 'SA👑S logo i paketens ände alt. Egen stämpel' }, // Note: The crown might need special handling or an image
      { label: 'Dimensioner (Tjocklek)', value: '19, 25, 32 mm, 38 mm' },
      { label: 'Dimensioner (Medelbredder)', value: '15-16 cm, 16-19 cm, 20-24 cm, 27 + cm' },
      { label: 'Längder', value: 'Fallande längder: från 2,7 - 6,0 meter. Medellängd ca: 4,0 meter' },
    ]
  },
  // --- Add entries for other products here ---
  'furu-sidobrador': {
    id: 'furu-sidobrador',
    name: 'Furu Sidobrädor',
    qualityDescriptor: 'Standardkvalitet', // Example
    stampImage: stampPlaceholder,
    logDiagramImage: logDiagramPlaceholder,
    pdfUrl: '#',
    certification: 'PEFC', // Example
    certificationLogo: pefcLogoPlaceholder,
    specs: [
       // Add specific specs for Furu Sidobrädor later
       { label: 'Råvara', value: 'Information kommer snart...' },
       { label: 'Torkning', value: 'Information kommer snart...' },
    ]
  },
   // Add placeholders for the rest
   'gran-stambrador': { id: 'gran-stambrador', name: 'Gran Stambrädor', specs: [{ label: 'Info', value: 'Kommer snart...' }] },
   'furu-stambrador': { id: 'furu-stambrador', name: 'Furu Stambrädor', specs: [{ label: 'Info', value: 'Kommer snart...' }] },
   'furu-massiva-amnen': { id: 'furu-massiva-amnen', name: 'Furu Massiva Ämnen', specs: [{ label: 'Info', value: 'Kommer snart...' }] },
   'kantade-furusidobrador': { id: 'kantade-furusidobrador', name: 'Kantade Furusidobrädor', specs: [{ label: 'Info', value: 'Kommer snart...' }] },

};
// ./Views/Information/Information.js
import React, { useState } from 'react';
import './Information.css'; // Create this CSS file


/*import banner from '../../images/hero_banner.jpg';
import sidobrador from '../../images/sidobrador.jpg';*/
import staplar from '../../images/staplar.jpg';
import drone_shot from '../../images/drone_shot.jpg';
import close_shot from '../../images/close_shot.jpg';
import sustain from '../../images/sustain.jpg';

// --- Using Picsum Photos placeholders ---
/*const picsumUrl = 'https://picsum.photos/';
const sectionImgW = '550';
const sectionImgH = '380';

const sustainableForestImg = `${picsumUrl}${sectionImgW}/${sectionImgH}?random=50`;
const sawmillProcessImg = `${picsumUrl}${sectionImgW}/${sectionImgH}?random=51`;
const woodSpeciesImg = `${picsumUrl}${sectionImgW}/${sectionImgH}?random=52`;
const dryingKilnImg = `${picsumUrl}${sectionImgW}/${sectionImgH}?random=53`;*/

// PDF link path
const sustainabilityPdfPath = "/pdfs/hallbarhetsmetoder.pdf";


const Information = () => {
   // State for each expandable section
   const [isFuruOpen, setIsFuruOpen] = useState(false);
   const [isGranOpen, setIsGranOpen] = useState(false);
 
   // Toggle functions
   const toggleFuru = () => setIsFuruOpen(!isFuruOpen);
   const toggleGran = () => setIsGranOpen(!isGranOpen);
 
   // Define the long text content separately for clarity
   const furuSpecsText = `Utvändigt kvist och bulfria rotstockar, raka, max. 1% båghöjd, ej vridvuxna, fria från röta, sprickor, blånad, insektskador samt tjurved. 
   Stockarna skall vara tätvuxna i rotändan, vilket innebär att det i området 2-8 cm från märgen skall finnas minst 20 årsringar. I övrigt skall årsringarna ha en jämn utveckling. 
   Märgen skall vara centrumställd. Virket skall vara vinter- avverkat och ej vattenlagrat.\n\nDimensioner: 22 cm i topp under bark, och grövre. Längder: 31 - 61 dm.\nI övrigt enligt VMR 1/99`;
   const granSpecsText = `Stockarna skall vara raka, max 1% båghöjd, fria från röta, blånad, insektskador, sprickor samt tjurved. Ej vridvuxna. 
   Tätvuxna i rotändan, vilket innebär att det i området 2-8 cm från märgen skall finnas minst 20 årsringar. I övrigt skall årsringarna ha en jämn utveckling. 
   Märgen skall vara centrumställd. Virket skall vara vinteravverkat och ej vattenlagrat\n\nKvistkrav: 4 st. friska kvistar med max. 25mm i diameter får förekomma eller 4 st. 
   torra kvistar med max. 20mm i diameter per sämsta 15 dm stocksektion. Dessutom tillåts 4 st. friska eller torra kvistar med en diameter mellan 10-15mm. 
   Kvistar mindre än 10mm beaktas ej.\n\nDimensioner: 22 cm i topp under bark och grövre. Längder: 31 - 61 dm.\nI övrigt gäller VMR 1/99`;

  return (
    <div className="information-page">
      <section className="page-header">
        <h1>Vår Verksamhet & Kunskap</h1>
        <p>Lär dig mer om hur vi arbetar med skog och trä – från rot till färdig bräda.</p>
      </section>

      {/* Section 1: Sourcing & Sustainability */}
      <section className="info-section">
        <div className="info-content">
          <h2>Ansvarsfullt Skogsbruk & Råvara</h2>
          <p>Första steget i kedjan mot kvalitets- produkter börjar i skogen. Genom upparbetade kontakter inom skogsbranschen har vi under åren säkerställt en tillgång på rotstocken för lång tid fram över!</p>
          <p>Ansgarius Svensson AB väljer ut rotstock efter speciellt ställda kvalitetskrav se nedan för Furu & Gran samt med hänsyn till ett naturvårdsanpassat skogsbruk.</p>

          {/* Expandable Section for Furu/Lärk */}
          <div className="expandable-section">
            <button
              className="expandable-header"
              onClick={toggleFuru}
              aria-expanded={isFuruOpen}
              aria-controls="furu-specs-content"
            >
              Kvalitetsbestämmelser för rotstockar av furu/lärk
              <span className={`expandable-icon ${isFuruOpen ? 'open' : ''}`}>▼</span>
            </button>
            {/* Conditionally render content based on state */}
            {/* Using CSS transition for height requires the div to always be in DOM */}
            <div
              id="furu-specs-content"
              className={`expandable-content ${isFuruOpen ? 'open' : ''}`}
              aria-hidden={!isFuruOpen}
            >
               {/* Use white-space pre-wrap to respect newlines in the text variable */}
              <p style={{ whiteSpace: 'pre-wrap' }}>{furuSpecsText}</p>
            </div>
          </div>

          {/* Expandable Section for Gran */}
          <div className="expandable-section">
            <button
              className="expandable-header"
              onClick={toggleGran}
              aria-expanded={isGranOpen}
              aria-controls="gran-specs-content"
            >
              Kvalitetsbestämmelser för rotstockar av gran
              <span className={`expandable-icon ${isGranOpen ? 'open' : ''}`}>▼</span>
            </button>
             <div
              id="gran-specs-content"
              className={`expandable-content ${isGranOpen ? 'open' : ''}`}
              aria-hidden={!isGranOpen}
            >
              <p style={{ whiteSpace: 'pre-wrap' }}>{granSpecsText}</p>
            </div>
          </div>

          {/* --- Replace the <p> tag with this --- */}
          <div className="pdf-link-container">
             <a
                href={sustainabilityPdfPath} // Use the variable for the path
                target="_blank"           // Open in new tab
                rel="noopener noreferrer" // Security best practice
                className="pdf-download-button" // Use a specific class for styling
             >
                 <span className="pdf-icon">📄</span> {/* Optional icon */}
                 Läs mer om Kvalitetsklassning av barrsågtimmer (PDF) {/* Update link text */}
             </a>
          </div>

        </div>
        <div className="info-image">
          <img src={sustain} alt="Hållbar skog" />
        </div>
      </section>

      {/* Section 2: Processing & Quality */}
      <section className="info-section alt-layout">
        <div className="info-image">
          <img src={drone_shot} alt="Sågverksprocess" />
        </div>
        <div className="info-content">
          <h2>Från Stock till Bräda: Sågning & Kvalitet</h2>
          <p>På vårt sågverk i Södra Vi omvandlas stockarna till sågade trävaror. Vi sågar med ramsåg vilket är det absolut bästa sågsättet för grovt timmer som vi sågar, med sågsnitt på rättplats i grova dimensioner kan vi leverera mycket hög kvalitet på det sågade.</p>
          <p>För att nå bästa resultat synas, mäts och kvalitetsbestäms varje planka/bräda <span className='information-italic'>(efter torkning)</span> manuellt av våra utbildade mätare allt enligt etablerade branschstandarder och våra egna högt ställda krav. Detta säkerställer att du får rätt kvalitet för ditt specifika projekt.</p>
          <ul>
            <li>Effektiv sågteknik för maximal kvalitet.</li>
            <li>Manuell sortering efter höga krav.</li>
            <li>Tydlig märkning av kvalitet och dimension.</li>
          </ul>
        </div>
      </section>

      {/* Section 3: Drying Process */}
      <section className="info-section">
         <div className="info-content">
            <h2>Torkning: En Nyckel till Stabilitet</h2>
            <p>Korrekt torkning är avgörande för träets formstabilitet och användbarhet. Beroende på produkt och kundens krav använder vi antingen lufttorkning under tak eller modern kammartorkning.</p>
            <p>Målet är att uppnå en specifik målfuktkvot <span className='information-italic'>(ofta runt 16% för skeppningstorr vara eller lägre för specialändamål)</span> med minimala spänningar i virket. Detta minskar risken för att träet vrider sig eller spricker efter leverans.</p>
            <ul>
                <li>Kontrollerad lufttorkning för skonsam process.</li>
                <li>Effektiv kammartorkning för specifika fuktkvoter.</li>
                <li>Regelbunden fuktkvotskontroll.</li>
            </ul>
         </div>
        <div className="info-image">
          <img src={close_shot} alt="Virkestork" />
        </div>
      </section>

       {/* Section 4: Wood Knowledge (Optional) */}
       <section className="info-section alt-layout">
        <div className="info-image">
          <img src={staplar} alt="Träslag Gran och Furu" />
        </div>
         <div className="info-content">
          <h2>Att Förstå Gran & Furu</h2>
          <p>Våra huvudträslag, gran och furu, har unika egenskaper:</p>
          <p><strong>Gran <span className='information-italic'>(Spruce)</span>:</strong> Ljusare i färgen, jämnare textur, relativt lätt och starkt i förhållande till sin vikt. Utmärkt för konstruktionsvirke, paneler och listverk.</p>
          <p><strong>Furu <span className='information-italic'>(Pine)</span>:</strong> Tydligare årsringar, ofta mer kvistar, kärnveden har naturlig motståndskraft. Bra för möbler, golv, fönster och utomhuspanel <span className='information-italic'>(särskilt kärnfuru)</span>.</p>
          <p>Valet av träslag beror på projektets krav på utseende, hållfasthet och beständighet. Kontakta gärna oss för mer information om vad som passar ditt projekt bäst.</p>
        </div>
      </section>

    </div>
  );
};

export default Information;
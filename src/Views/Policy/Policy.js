// ./Views/Policy/Policy.js
import React from 'react';
import './Policy.css'; // Create this CSS file

const Policy = () => {
  return (
    <div className="policy-page">
       <section className="page-header">
        <h1>Våra Policier</h1>
        <p>Vårt engagemang för kvalitet, hållbarhet och säkerhet.</p>
      </section>

      <section className="policy-content">
        {/* Quality Policy Section */}
        <article className="policy-section">
          <h2>Kvalitetssäkring</h2>
          <p>Vi är fast beslutna att tillhandahålla träprodukter som uppfyller eller överträffar industristandarder och kundernas förväntningar. 
            Vår kvalitetskontrollprocess innefattar rigorös inspektion i flera steg, från inköp av råvaror till slutlig produktgradering.</p>
          <p>Vi övervakar kontinuerligt våra processer och söker förbättringsmöjligheter inom produktkvaliten och konsekvensen.</p>
          <ul>
            <li>Betygsverifiering</li>
            <li>Fukthaltskontroller</li>
            <li>Måttnoggrannhetsmätningar</li>
            <li>Visuell kontroll för defekter</li>
          </ul>
        </article>

        {/* Sustainability Policy Section */}
         <article className="policy-section">
          <h2>Miljö</h2>
          <p>Hos oss på Ansgarius Svensson AB är miljön en viktig del i vår verksamhet. Vi strävar efter att arbeta med skogsbolag / skogsägare* där avverkningen sker med minsta möjliga miljöpåverkan och ett minimum av skador på kvarvarande träd.</p>
          <p>
            Vi skall uppfylla gällande lagstiftning samt följa PEFC´s™ och FSC®’s -krav och intentioner och så långt möjligt förvissa oss om att råvaran ej kommer från olaglig eller av samhället icke auktoriserad avverkning, 
            nyckelbiotoper, skogsområden där hävdvunna eller medborgerliga rättigheter kränks, skogar där höga bevarandevärden är hotade, 
            genmanipulerade träd eller naturskog som har avverkats i syfte att nyttja området för plantager eller ickeskoglig markanvändning. 
            Verksamheten skall bedrivas och förbättras på ett sådant sätt att den eventuella negativa påverkan på miljön minskar, ILO:s kärnkonventioner kränks.
          </p>
          <p>Råvaran skall till största möjliga andel komma från ett miljöanpassat certifierat skogsbruk. Ansgarius Svensson AB skall verka för att denna volym ökar.</p>
          <p>Vi skall på ett ansvarsfullt sätt fullgöra våra åtagande mot anställda, samhälle, miljö och uppdragstagare.</p>
          <ul>
            <li>Tar tillvara på hela stocken. Utöver brädor och plankor tillverkas spån och flis för värme till bostäder och industrier.</li>
            <li>Källsorterar avfall och lämnar till återvinningsföretag.</li>
            <li>Arbetar för minskning av vatten- och el-förbrukning.</li>
          </ul>
           <p>Vårt miljöarbete ska skapa goda förutsättningar för hållbar affärsutveckling och ökad konkurrenskraft. 
            Vi uppfyller gällande lagar, bestämmelser och tillstånd. Genom ständiga förbättringar är vår ambition att vara ledande och ett föredöme på den Europiska marknaden.</p>
            <p>*En stor del av våra råvaruleverantörer är certifierade enligt FSC ®:s samt PEFC™ principer och kriterier.</p>
            <p>
              PEFC™ (Programme for the Endorsement of Forest Certification schemes). 
              PEFC™ är ett internationellt system för certifiering, i första hand av familjeskogsbruk. PEFC-certifieringen innebär att råvaran kommer från ett uthålligt skogsbruk som drivs naturanpassat, miljövänligt och socialt ansvarsfullt.
            </p>
            <p>
            FSC® (Forest Stewardship Council). FSC® är en internationell, oberoende och ideell organisation för certifiering av skogsbruk som uppfyller bestämda ekologiska, sociala och ekonomiska krav.
            </p>
        </article>

         {/* Safety Policy Section */}
         <article className="policy-section">
          <h2>Säkerhet på arbetsplatsen</h2>
          <p>Säkerheten för våra anställda, kunder och besökare är av största vikt. Vi upprätthåller ett omfattande säkerhetsprogram som inkluderar regelbunden utbildning, underhåll av utrustning och efterlevnad av alla relevanta säkerhetsföreskrifter.</p>
          <p>Vi främjar en kultur av säkerhetsmedvetenhet och uppmuntrar rapportering av potentiella faror. Vårt mål är en noll-incident arbetsplats.</p>
        </article>

         {/* Add other policy sections as needed (e.g., Privacy, Terms of Service) */}

      </section>
    </div>
  );
};

export default Policy;
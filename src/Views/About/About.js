// ./Views/About/About.js
import React from 'react';
import './About.css'; // Create this CSS file

// Placeholder images
/*const placeholderBaseUrl = 'https://via.placeholder.com/';
const aboutHeroSize = '1200x400';
const teamPhotoSize = '600x400';
const valuesIconSize = '60x60';

const aboutHeroImg = `${placeholderBaseUrl}${aboutHeroSize}/cccccc/808080?text=Our+Workshop/Forest`;
const teamPhotoImg = `${placeholderBaseUrl}${teamPhotoSize}/cccccc/808080?text=Our+Team`;
const sustainabilityIcon = `${placeholderBaseUrl}${valuesIconSize}/a9a9a9/ffffff?text=Sustain`;
const qualityIcon = `${placeholderBaseUrl}${valuesIconSize}/a9a9a9/ffffff?text=Quality`;
const communityIcon = `${placeholderBaseUrl}${valuesIconSize}/a9a9a9/ffffff?text=Community`;*/

import banner from '../../images/hero_banner.jpg';
import sidobrador from '../../images/sidobrador.jpg';
import staplar from '../../images/staplar.jpg';
import drone_shot from '../../images/drone_shot.jpg';
import close_shot from '../../images/close_shot.jpg';
import sustain from '../../images/sustain.jpg';

const picsumUrl = 'https://picsum.photos/';

const aboutHeroImg = `${picsumUrl}1920/600?random=10`;
const iconSize = '150';
const sustainabilityIcon = `${picsumUrl}${iconSize}?random=11`;
const qualityIcon = `${picsumUrl}${iconSize}?random=12`;
const teamIcon = `${picsumUrl}${iconSize}?random=13`;
// const techIcon = `${picsumUrl}${iconSize}?random=14`; // Keep commented if not used

const productImgW = '400';
const productImgH = '250';
const communityIcon = `${picsumUrl}${productImgW}/${productImgH}?random=15`;
const teamPhotoImg = `${picsumUrl}${productImgW}/${productImgH}?random=16`;
const plywoodImg = `${picsumUrl}${productImgW}/${productImgH}?random=17`;
const specialtyCutsImg = `${picsumUrl}${productImgW}/${productImgH}?random=18`;

const aboutUsImg = `${picsumUrl}500/400?random=19`;
const whyChooseUsImg = `${picsumUrl}500/350?random=20`;


const About = () => {
  return (
    <div className="about-page">
      {/* Optional Hero for About Page */}
      <section className="about-hero" style={{ backgroundImage: `url(${banner})`, backgroundColor: '#cccccc' }}>
         <div className="hero-overlay"></div>
         <div className="hero-content">
             <h1>Om oss</h1>
             <p>Lär dig mer om vår historia, värderingar och engangemang för hållbart virke.</p>
         </div>
      </section>

      {/* Our Story Section */}
      <section className="about-section text-section">
        <h2>Fakta om företaget</h2>
        <p>Ett familjeägt kvalitetssågverk som grundades 1962. Sågverket är beläget i Södra Vi, 10 km norr om Vimmerby i Småland, mitt i det område där den s.k. Vimmerby tallen av hög kvalitet växer.</p>
        <p>Vi sågar med ramsåg vilket är det absolut bästa sågsättet för grovt timmer som vi sågar, med sågsnitt på rättplats i grova dimensioner kan vi leverera mycket hög kvalitet på det sågade.</p>
        <p>Råvaran är rotstockar av tall, gran och lärk av högsta kvalitet som kommer från ett område mellan Småland och Värmland, dessutom importeras en del tall och gran från Norge.
          Vi producerar årligen i sågad vara ca. 12000 m³ tall, ca. 3000 m³ gran och ca. 2000 m³ lärk.</p>
        <p>För närvarande jobbar 12 personer i vår produktion, och 3 personer på kontoret.</p>
        <p>Våra kunder är fönster- list- möbelsnickare och andra trägrossister i Europa. Vi exporterar ca 70 % till Tyskland och ca 15 % till Italien, Danmark och resten i Sverige och andra länder. 
          Vi tillhandahåller ett tätvuxet, kvistfritt och hartsrikt kärnvirke som rätt använt är ett mycket beständigt material.</p>
      </section>

      {/* Our Values Section */}
      <section className="about-section values-section">
        <h2>Våra kärnvärderingar</h2>
        <div className="values-grid">
          <div className="value-item">
            <img src={sustain} alt="Sustainability Icon" />
            <h3>Hållbarhet</h3>
            <p>Engagerad i ett ansvarsfullt skogsbruk och att minimera vår miljöpåverkan.</p>
          </div>
          <div className="value-item">
            <img src={staplar} alt="Quality Icon" />
            <h3>Kvalitet</h3>
            <p>Manuell syning, mätning och kvalitetsbedömning för att säkerställa att varje planka/bräda uppfyller hårda krav.</p>
          </div>
           <div className="value-item">
            <img src={close_shot} alt="Community Icon" />
            <h3>Gemenskap</h3>
            <p>Bygga starka relationer med våra kunder, leverantörer och lokalsamhället.</p>
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="about-section team-section">
        <div className="team-content">
           <h2>Gruppen</h2>
           <p>Vårt erfarna team tillför passion och erfarenhet till alla aspekter av vår verksamhet. Vi är engagerade proffs med över 50 år inom branschen redo att hjälpa dig med dina virkesbehov.</p>
           {/* Could add specific team member profiles later */}
        </div>
        <div className="team-image">
            <img src={drone_shot} alt="Placeholder for Team Photo" />
        </div>
      </section>

      {/* Call to Action */}
      <section className="about-section cta-section">
        <h2>Redo att starta ditt projekt?</h2>
        <p>Utforska våra produkter eller kontakta oss idag för att diskutera dina behov.</p>
        <div>
           <a href="/products" className="cta-button primary">Visa produkter</a> {/* Use Link from react-router-dom if preferred */}
           <a href="/contact" className="cta-button secondary">Kontakta oss</a> {/* Assuming a /contact route exists or will be added */}
        </div>
      </section>

    </div>
  );
};

export default About;
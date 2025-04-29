// ./Views/Home/Home.js
import React from 'react';
import './home.css'; // Ensure this CSS file exists and is styled correctly
import { Link } from 'react-router-dom'; // Use Link for internal navigation


import banner from '../../images/hero_banner.jpg';
import sidobrador from '../../images/sidobrador.png';
import staplar from '../../images/staplar.png';
import drone_shot from '../../images/dronarbild.png';
import close_shot from '../../images/close_shot.jpg';
import sustain from '../../images/sustain.jpg';
import ramen from '../../images/ramen.jpg';
import kantvirke from '../../images/kantvirkespaket.png';
import trad_ringar from '../../images/trad_ringar.png';


const Home = () => {
  return (
    <div className="home-page">

      {/* --- Hero Section --- */}
      <section className="hero-section" style={{ backgroundImage: `url(${banner})` }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Kvalitétsvirke för alla tillfällen</h1>
          {/* Link to the main products page */}
          <Link to="/products" className="cta-button">Utforska våra produkter</Link> {/* Changed to Link */}
        </div>
      </section>

      {/* --- Expertise Section --- */}
      <section className="expertise-section">
        <h2>Vår expertis</h2>
        <div className="expertise-grid">
          {/* ... expertise items ... */}
          <div className="expertise-item">
            <img src={sustain} alt="Hållbarhet" className="expertise-icon" />
            <h3>Hållbarhet</h3>
            <p>Näravvecklade rotstockar. Vi tar tillvara på hela stocken och källsorterar avfall. 
              Vi strävar efter avverkning med minsta påverkan på miljön och vi skall uppfylla lagstifning samt följa  PEFC´s™ och FSC®’s krav och intentioner.</p>
          </div>
          <div className="expertise-item">
            <img src={close_shot} alt="Kvalitetskontroll" className="expertise-icon" />
            <h3>Kvalitetskontroll</h3>
            <p>För att nå bästa resultat synas, mäts och kvalitetsbedöms varje planka/bräda (efter torkning) manuellt av våra mätare. Uppfylls inte kraven läggs plankan/brädan i andrahandssortiment.</p>
          </div>
          <div className="expertise-item">
            <img src={drone_shot} alt="Erfaren grupp" className="expertise-icon" />
            <h3>Erfaren grupp</h3>
            <p>Utbildade arbetare med lång erfarenhet och kunskap inom trä och kvalitet av att mäta det specialsortiment vi sågar. För närvarande jobbar 13 personer i vår produktion, och 3 på kontoret.</p>
          </div>
        </div>
      </section>

      {/* --- Featured Products Section --- */}
      <section className="featured-products-section">
        <h2>Utvalda produkter</h2>
        <div className="products-grid">
          {/* --- Product Cards - Link to main Products page for now --- */}
          {/* If you want these to link to specific products, change the `to` prop */}
          <div className="product-card">
            <img src={sidobrador} alt="Sidobrädor" />
            <h3>Sidobrädor</h3>
            {/* Link to main products page */}
            <Link to="/products" className="details-button">Visa detaljer</Link>
            {/* Example linking to a SPECIFIC product (if you know the ID): */}
            {/* <Link to="/products/gran-sidobrador" className="details-button">View Details</Link> */}
          </div>
          <div className="product-card">
            <img src={staplar} alt="Stambrädor" />
            <h3>Stambrädor</h3>
             {/* Link to main products page */}
            <Link to="/products" className="details-button">Visa detaljer</Link>
          </div>
          <div className="product-card">
            <img src={kantvirke} alt="Kantade ämnen" />
            <h3>Kantade ämnen</h3>
             {/* Link to main products page */}
            <Link to="/products/furu-massiva-amnen" className="details-button">Visa detaljer</Link>
          </div>
          <div className="product-card">
            <img src={close_shot} alt="Special beställning" />
            <h3>Special beställning</h3>
             {/* Link to main products page */}
            <Link to="/products/kantade-furusidobrador" className="details-button">Visa detaljer</Link>
          </div>
        </div>
      </section>

      {/* --- About Us Section --- */}
      <section className="about-us-section">
        <div className="about-us-image-container">
          <img src={ramen} alt="Company representative" />
        </div>
        <div className="about-us-content">
          <h2>Om oss</h2>
          <p>Ett familjeägt kvalitetssågverk som grundades 1962. Sågverket är beläget i Södra Vi, 10 km norr om Vimmerby i Småland. Sågar rotstockar med ramsåg och fokuserar på skandinaviskt virke av hög kvalitet.</p>
          {/* Link to the About page */}
          <Link to="/about" className="learn-more-link">Läs mer om oss som företag</Link>
        </div>
      </section>

      {/* --- Why Choose Us Section --- */}
      <section className="why-choose-us-section">
         <div className="why-choose-us-content">
          <h2>Varför Ansgarius Svensson?</h2>
          <ul>
            <li><span className="check-icon">✓</span> Överlägsen kvalité</li>
            <li><span className="check-icon">✓</span> Smidiga leveranser</li>
            <li><span className="check-icon">✓</span> Hållbara metoder</li>
            <li><span className="check-icon">✓</span> Lång erfarenhet</li>
          </ul>
        </div>
        <div className="why-choose-us-image-container">
          <img src={drone_shot} alt="High-quality lumber stack" />
        </div>
      </section>

      {/* --- Employee Login Link Section --- */}
      <section className="employee-login-link-section">
        <p>Anställd? <Link to="/dashboard">Till plattformen</Link></p>
      </section>

    </div>
  );
};

export default Home;
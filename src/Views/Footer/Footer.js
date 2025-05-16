// ./Views/Footer/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const companyName = "Ansgarius Svensson AB";
  const streetAddress = "Industrigatan 35";
  const city = "Södra Vi";
  const stateZip = "598 73";
  const phone = "(555) 123-4567"; // Replace number
  const fullAddress = `${companyName}`;
  const googleMapsQuery = encodeURIComponent(fullAddress);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${googleMapsQuery}`;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="main-footer">
      <div className="footer-content">

        <div className="footer-section footer-about">
          <h3>{companyName}</h3>
          <p>Tillhandahåller hållbara virkeslösningar sedan 1962. Kvalitetsträprodukter du kan lita på.</p>
        </div>

        <div className="footer-section footer-links">
          <h3>Länkar</h3>
          <ul>
            <li><Link to="/">Hem</Link></li>
            <li><Link to="/products">Produkter</Link></li>
            <li><Link to="/about">Om oss</Link></li>
            <li><Link to="/information">Produktion</Link></li>
            <li><Link to="/contact">Kontakta oss</Link></li>
            <li><Link to="/policy">Våra policier</Link></li>
          </ul>
        </div>

        <div className="footer-section footer-contact">
          <h3>Kontakt & Plats</h3>
          <p>
            {streetAddress}<br />
            {city}, {stateZip}<br />
            Telefon: <a href={`tel:+1${phone.replace(/\D/g,'')}`}>{phone}</a>
          </p>
          <a
             href={googleMapsUrl}
             target="_blank"
             rel="noopener noreferrer"
             className="map-link" // Simple text link style
           >
            Hitta oss på Google Maps
          </a>
        </div>

      </div>
      <div className="footer-bottom">
        © {currentYear} {companyName}. All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;
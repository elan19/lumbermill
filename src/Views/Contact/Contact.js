// ./Views/Contact/Contact.js
import React, { useState } from 'react'; // Import useState
import './Contact.css';
import CustomerFormModal from './CustomerFormModal.js'; // Import the modal

const mapEmbedSrc = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2625.6610780723167!2d15.787239200000002!3d57.744243100000006!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4659c8191f871a79%3A0xb9f354dab04bf0e9!2sAnsgarius%20Svensson%20AB!5e1!3m2!1ssv!2sse!4v1744831168714!5m2!1ssv!2sse";

// Company Details
const companyName = "Ansgarius Svensson AB";
const boxAddress = "Box 145";
const streetAddress = "Industrigatan 35";
const city = "Södra Vi";
const postalCode = "598 71";
const fullAddressQuery = `${companyName}, ${streetAddress}, ${city}`;
const googleMapsQuery = encodeURIComponent(fullAddressQuery);
const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${googleMapsQuery}`;

const mainPhone = "0492-201 05";
const mainFax = "0492-206 00";
const mainEmail = "info@ansvab.se";

// Individual Contacts Data (Example)
const contacts = [
  { name: "Johan Blom", title: "Försäljning / Inköp", tel: "0492-201 05", mobil: "070-5720105", direkt: "0492-206 05", email: "johan@ansvab.se" },
  { name: "Jan Praznik", title: "Försäljning / Inköp", tel: "0492-201 05", mobil: "070-5720105", direkt: "0492-206 05", email: "jan@ansvab.se" },
  { name: "Anna-Carin Rinaldo", title: "Ekonomi", tel: "0492-201 05", mobil: "070-5720105", direkt: "0492-206 05", email: "anna-carin@ansvab.se" },
  // Add more contacts as needed
];


const Contact = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="contact-page">
      <section className="page-header">
        {/* Keep or update heading as needed */}
        <h1>Kontakta Oss</h1>
        <p>Här hittar du våra kontaktuppgifter. Välkommen att höra av dig!</p>
      </section>

      <section className="contact-content">
        {/* --- Left Column: Contact Details --- */}
        <div className="contact-details">
          <h2>Kontaktinformation</h2>

          {/* Main Company Info */}
          <div className="main-address">
             <strong>{companyName}</strong><br />
             Boxadress: {boxAddress}, {postalCode} {city}<br />
             Besöksadress: {streetAddress}, {postalCode} {city}<br />
             <div className="main-contact-grid">
                <span>Vxl: <a href={`tel:${mainPhone.replace(/-/g, '')}`}>{mainPhone}</a></span>
                <span>Fax: {mainFax}</span>
                <span>E-post: <a href={`mailto:${mainEmail}`}>{mainEmail}</a></span>
             </div>
          </div>

          <hr className="contact-divider" />

          {/* Individual Contacts */}
          {contacts.map((person, index) => (
            <div key={index} className="contact-person">
              <h3>{person.name}</h3>
              <p className="contact-title">{person.title}</p>
              <div className="person-details-grid">
                {person.tel && <span>Tel vxl: {person.tel}</span>}
                {person.mobil && <span>Mobil: {person.mobil}</span>}
                {person.direkt && <span>Direkt: {person.direkt}</span>}
                {person.email && <span><a href={`mailto:${person.email}`}>Skicka e-mail</a></span>}
              </div>
            </div>
          ))}

           <hr className="contact-divider" />

           {/* Become Customer Button */}
           <div className="become-customer-section">
                <button onClick={openModal} className="cta-button">
                    Vill du bli kund hos {companyName}?
                </button>
           </div>

        </div> {/* End contact-details */}
        
        {/* --- Right Column: Map --- */}
        <div className="contact-map">
          <h2>Vår Plats</h2>
          <div className="map-iframe-container"> {/* Added container for aspect ratio */}
            <iframe
                src={mapEmbedSrc} // Use the variable for the src
                width="600" // Will be overridden by CSS
                height="450" // Will be overridden by CSS
                style={{ border: 0 }} // Inline style for border
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Karta som visar platsen för ${companyName}`} // Accessibility title
            ></iframe>
          </div>
          <a
             href={googleMapsUrl}
             target="_blank"
             rel="noopener noreferrer"
             className="map-link-button"
           >
            Hitta hit (Google Maps)
          </a>
        </div>
      </section>

      {/* Conditionally render the modal */}
      {isModalOpen && <CustomerFormModal onClose={closeModal} />}

    </div>
  );
};

export default Contact;
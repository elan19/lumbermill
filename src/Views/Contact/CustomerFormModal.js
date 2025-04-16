// ./Views/Contact/CustomerFormModal.js
import React, { useState } from 'react';
import './CustomerFormModal.css'; // We'll create this CSS file

const CustomerFormModal = ({ onClose }) => {
  // Basic state for form fields (can be expanded for actual handling)
  const [formData, setFormData] = useState({
    companyName: '', orgNr: '', contactPerson: '', billingAddress: '',
    zipCode: '', city: '', phone: '', fax: '', email: '', website: '',
    deliverySame: true, deliveryCompanyName: '', deliveryAddress: '',
    deliveryZipCode: '', deliveryCity: '', businessType: '', otherInfo: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add form submission logic here (e.g., send data to backend)
    console.log('Form submitted:', formData);
    alert('Tack för din ansökan! Vi återkommer snart.'); // Placeholder feedback
    onClose(); // Close modal after submission
  };

  const handleReset = () => {
     // Reset form fields to initial state or empty
    setFormData({
        companyName: '', orgNr: '', contactPerson: '', billingAddress: '',
        zipCode: '', city: '', phone: '', fax: '', email: '', website: '',
        deliverySame: true, deliveryCompanyName: '', deliveryAddress: '',
        deliveryZipCode: '', deliveryCity: '', businessType: '', otherInfo: ''
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}> {/* Close on overlay click */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Prevent closing when clicking inside */}
        <button className="modal-close-btn" onClick={onClose}>×</button>
        <h2>Bli Kund hos Ansgarius Svensson AB</h2>
        <p style={{textAlign: 'center', fontSize: '0.9em', marginBottom: '20px'}}>Fyll i formuläret nedan. Fält markerade med * är obligatoriska.</p>

        <form onSubmit={handleSubmit} onReset={handleReset} className="customer-form">
          {/* Billing Address Section */}
          <fieldset>
             <legend>Faktureringsuppgifter</legend>
             <div className="form-group">
               <label htmlFor="companyName">Företagsnamn*:</label>
               <input type="text" id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} required />
             </div>
              <div className="form-group inline"> {/* Example inline group */}
                  <div>
                      <label htmlFor="orgNr">Org.nr*:</label>
                      <input type="text" id="orgNr" name="orgNr" value={formData.orgNr} onChange={handleChange} required />
                  </div>
                  <div>
                     <label htmlFor="contactPerson">Kontaktperson*:</label>
                     <input type="text" id="contactPerson" name="contactPerson" value={formData.contactPerson} onChange={handleChange} required />
                  </div>
             </div>
             <div className="form-group">
               <label htmlFor="billingAddress">Faktureringsadress*:</label>
               <input type="text" id="billingAddress" name="billingAddress" value={formData.billingAddress} onChange={handleChange} required />
             </div>
             <div className="form-group inline">
                 <div>
                     <label htmlFor="zipCode">Postnr*:</label>
                     <input type="text" id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleChange} required />
                 </div>
                 <div>
                     <label htmlFor="city">Ort*:</label>
                     <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} required />
                 </div>
             </div>
             <div className="form-group inline">
                 <div>
                    <label htmlFor="phone">Telefon*:</label>
                    <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
                 </div>
                 <div>
                    <label htmlFor="fax">Fax nr:</label>
                    <input type="tel" id="fax" name="fax" value={formData.fax} onChange={handleChange} />
                 </div>
             </div>
             <div className="form-group inline">
                <div>
                    <label htmlFor="email">E-post*:</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div>
                    <label htmlFor="website">Hemsida:</label>
                    <input type="url" id="website" name="website" value={formData.website} onChange={handleChange} />
                </div>
             </div>
          </fieldset>

           {/* Delivery Address Section */}
          <fieldset>
             <legend>Leveransadress</legend>
              <div className="form-group checkbox-group">
                  <input type="checkbox" id="deliverySame" name="deliverySame" checked={formData.deliverySame} onChange={handleChange} />
                  <label htmlFor="deliverySame">Samma som ovan</label>
             </div>
             {!formData.deliverySame && ( // Only show if checkbox is unchecked
                <>
                    <div className="form-group">
                        <label htmlFor="deliveryCompanyName">Företagsnamn*:</label>
                        <input type="text" id="deliveryCompanyName" name="deliveryCompanyName" value={formData.deliveryCompanyName} onChange={handleChange} required={!formData.deliverySame} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="deliveryAddress">Adress*:</label>
                        <input type="text" id="deliveryAddress" name="deliveryAddress" value={formData.deliveryAddress} onChange={handleChange} required={!formData.deliverySame} />
                    </div>
                     <div className="form-group inline">
                        <div>
                            <label htmlFor="deliveryZipCode">Postnr*:</label>
                            <input type="text" id="deliveryZipCode" name="deliveryZipCode" value={formData.deliveryZipCode} onChange={handleChange} required={!formData.deliverySame} />
                        </div>
                        <div>
                           <label htmlFor="deliveryCity">Ort*:</label>
                           <input type="text" id="deliveryCity" name="deliveryCity" value={formData.deliveryCity} onChange={handleChange} required={!formData.deliverySame} />
                        </div>
                    </div>
                </>
             )}
          </fieldset>

           {/* Other Info Section */}
          <fieldset>
             <legend>Övrig Information</legend>
             <div className="form-group">
               <label htmlFor="businessType">Verksamhetsinriktning*:</label>
               <input type="text" id="businessType" name="businessType" placeholder="Slutförbrukare, Agent, Lagerförsäljning, Timmerförsäljning" value={formData.businessType} onChange={handleChange} required />
             </div>
              <div className="form-group">
               <label htmlFor="otherInfo">Övrig information:</label>
               <textarea id="otherInfo" name="otherInfo" rows="4" value={formData.otherInfo} onChange={handleChange}></textarea>
             </div>
          </fieldset>

          <div className="form-actions">
            <button type="submit" className="form-button submit">Skicka formuläret!</button>
            <button type="reset" className="form-button reset">Rensa</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerFormModal;
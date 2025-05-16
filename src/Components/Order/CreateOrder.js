import React, { useState } from 'react';
import axios from 'axios';
import styles from './CreateOrder.module.css'; // Ensure this file exists

const CreateOrder = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [customer, setCustomer] = useState('');
  const [delivery, setDelivery] = useState('');
  const [notes, setNotes] = useState('');
  const [speditor, setSpeditor] = useState('');
  // Start with one template item in each list
  const [prilistas, setPrilistas] = useState([
    { quantity: '', size: '', type: '', dimension: '', location: '', description: '', measureLocation: '' },
  ]);
  const [kantlistas, setKantlistas] = useState([
    { antal: '', bredd: '', tjocklek: '', varv: '', max_langd: '', stampel: '', lagerplats: '', information: '', status: { kapad: false, klar: false } },
  ]);
  const [klupplistas, setKlupplistas] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const token = localStorage.getItem('token');

  // Handler for Prilista changes (handles text, number, select, checkbox)
  const handlePrilistaChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const updatedPrilistas = [...prilistas];
    const currentItem = updatedPrilistas[index];
    const newValue = type === 'checkbox' ? checked : value; // Use checked for checkboxes, value otherwise
    updatedPrilistas[index] = { ...currentItem, [name]: newValue }; // Update field based on input's name
    setPrilistas(updatedPrilistas);
  };

  // Adds a new empty Prilista item
  const addPrilista = () => {
    setPrilistas([
      ...prilistas,
      { quantity: '', size: '', type: '', dimension: '', location: '', description: '', measureLocation: '' },
    ]);
  };

  // Removes a Prilista item by index (allows removing the last one)
  const removePrilista = (index) => {
    setPrilistas(prilistas.filter((_, i) => i !== index));
  };

  // Handler for Kantlista changes (handles text, number, select, checkbox, nested status)
  const handleKantlistaChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const updatedKantlistas = [...kantlistas];
    const currentItem = updatedKantlistas[index];
    const newValue = type === 'checkbox' ? checked : value;

    if (name.startsWith('status.')) { // Handle nested status fields specifically
      const statusField = name.split('.')[1];
       updatedKantlistas[index] = {
           ...currentItem,
           status: { ...currentItem.status, [statusField]: newValue }
       };
    } else { // Handle top-level fields (like 'antal', 'bredd', 'klupplager')
      updatedKantlistas[index] = { ...currentItem, [name]: newValue };
    }
    setKantlistas(updatedKantlistas);
  };

  // Adds a new empty Kantlista item
  const addKantlista = () => {
    setKantlistas([
      ...kantlistas,
      { antal: '', bredd: '', tjocklek: '', varv: '', max_langd: '', stampel: '', lagerplats: '', information: '', status: { kapad: false, klar: false } },
    ]);
  };

  // Removes a Kantlista item by index (allows removing the last one)
  const removeKantlista = (index) => {
    setKantlistas(kantlistas.filter((_, i) => i !== index));
  };

  const handleKlupplistaChange = (index, e) => {
    const { name, value, type, checked } = e.target; // Get details from event
    const updatedKlupplistas = [...klupplistas];      // Copy state
    const currentItem = updatedKlupplistas[index];   // Get the item being changed
    const newValue = type === 'checkbox' ? checked : value; // Handle checkbox vs other inputs

    // Handle nested status object if needed (schema shows klar/ej_Klar)
    if (name.startsWith('status.')) {
        const statusField = name.split('.')[1];
        updatedKlupplistas[index] = {
            ...currentItem,
            status: { ...currentItem.status, [statusField]: newValue }
        };
    } else {
        // Update top-level field based on input's 'name' attribute
        updatedKlupplistas[index] = { ...currentItem, [name]: newValue };
    }
    setKlupplistas(updatedKlupplistas); // Update state
  };

  const addKlupplista = () => {
    setKlupplistas([
      ...klupplistas,
      // Add a new klupplista object with default/empty values
      {
        sagverk: '', dimension: '', max_langd: '', pktNumber: '', sort: '', stad: '', special: '', magasin: '', lagerplats: '',
        leveransDatum: '', information: '', status: { klar: false, ej_Klar: null }
        // Note: orderNumber and kund are added on the backend during creation
      },
    ]);
  };

  const removeKlupplista = (index) => {
    // Allow removing all items
    setKlupplistas(klupplistas.filter((_, i) => i !== index));
  };
  // --- END OF KLUPPLISTA HANDLERS ---

  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Filter out empty items for all lists
    const finalPrilistas = prilistas.filter(p => p.quantity || p.dimension || p.size || p.type );
    const finalKantlistas = kantlistas.filter(k => k.antal || k.bredd || k.tjocklek );
    // --- FILTER KLUPPLISTAS ---
    const finalKlupplistas = klupplistas.filter(kl => kl.dimension || kl.max_langd || kl.antal ); // Adjust filter criteria as needed

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/orders/create`, {
        orderNumber,
        customer,
        delivery,
        notes,
        speditor,
        prilistas: finalPrilistas,
        kantlistas: finalKantlistas,
        klupplistas: finalKlupplistas, // <-- INCLUDE KLUPPLISTAS
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(finalKlupplistas);

      setSuccess(true);
      // Reset form fields
      setOrderNumber('');
      setCustomer('');
      setDelivery('');
      setNotes('');
      setSpeditor('');
      // Reset lists
      setPrilistas([{ quantity: '', size: '', type: '', dimension: '', location: '', description: '', measureLocation: '' }]);
      setKantlistas([{ antal: '', bredd: '', tjocklek: '', varv: '', max_langd: '', stampel: '', lagerplats: '', information: '', status: { kapad: false, klar: false } }]);
      setKlupplistas([]); // <-- RESET KLUPPLISTAS TO EMPTY

    } catch (err) {
      console.error("Error creating order:", err);
      setError(err.response?.data?.message || err.message || 'Misslyckades att skapa ordern!');
    }
  };

  // JSX Structure
  return (
    <div className={styles.createOrderContainer}>
      <h2>Skapa ny order</h2>
      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>Order skapades!</div>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <p className={styles.requiredNote}>Fält markerade med * är obligatoriska.</p>

        {/* Orderinformation Section */}
        <fieldset className={styles.formSection}>
            <legend>Orderinformation</legend>
            <div className={styles.inputGroup}><label htmlFor="orderNumber">Ordernummer *</label><input id="orderNumber" type="number" placeholder="Ex. 101" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} required /></div>
            <div className={styles.inputGroup}><label htmlFor="customer">Kund *</label><input id="customer" type="text" placeholder="Kundens namn" value={customer} onChange={(e) => setCustomer(e.target.value)} required /></div>
            <div className={styles.inputGroup}><label htmlFor="delivery">Leveranstid</label><input id="delivery" type="text" placeholder="Ex. v.01, Datum, Omgående" value={delivery} onChange={(e) => setDelivery(e.target.value)} /></div>
            <div className={styles.inputGroup}><label htmlFor="speditor">Speditör</label><input id="speditor" type="text" placeholder="Övrig information om speditörn..." value={speditor} onChange={(e) => setSpeditor(e.target.value)} /></div>
            <div className={styles.inputGroup}><label htmlFor="notes">Anteckningar</label><textarea id="notes" value={notes} placeholder="Övrig information om ordern..." className={styles.textareaNotes} rows="4" onChange={(e) => setNotes(e.target.value)} /></div>
        </fieldset>

        {/* Prilistas Section */}
        <fieldset className={styles.formSection}>
          <legend>Okantad</legend>
          {prilistas.length === 0 && <p className={styles.emptyListNote}>Inga okantade artiklar tillagda.</p>}
          {prilistas.map((prilista, index) => (
            <div key={`prilista-${index}`} className={styles.listItem}>
              <h4>Okantad Artikel #{index + 1}</h4>
              <div className={styles.itemInputs}>
                <div className={styles.inputGroup}>
                    <label htmlFor={`p-qty-${index}`}>Antal *</label>
                    <input id={`p-qty-${index}`} type="number" placeholder="Antal pkt" name="quantity" value={prilista.quantity} onChange={(e) => handlePrilistaChange(index, e)} required min="1"/>
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor={`p-dim-${index}`}>Dimension *</label>
                    <input id={`p-dim-${index}`} type="text" placeholder="Tjocklek (ex. 50)" name="dimension" value={prilista.dimension} onChange={(e) => handlePrilistaChange(index, e)} required/>
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor={`p-size-${index}`}>Storlek *</label>
                    <input id={`p-size-${index}`} type="text" placeholder="Sidor/Breda/tumtal" name="size" value={prilista.size} onChange={(e) => handlePrilistaChange(index, e)} required/>
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor={`p-type-${index}`}>Träslag *</label>
                    <input id={`p-type-${index}`} type="text" placeholder="Ex. Furu" name="type" value={prilista.type} onChange={(e) => handlePrilistaChange(index, e)} required/>
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor={`p-loc-${index}`}>Lagrad Plats</label>
                    <input id={`p-loc-${index}`} type="text" placeholder="Ex. JB 4h" name="location" value={prilista.location} onChange={(e) => handlePrilistaChange(index, e)}/>
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor={`p-mloc-${index}`}>Mätplats</label>
                    <select id={`p-mloc-${index}`} className={styles.selectField} name="measureLocation" value={prilista.measureLocation} onChange={(e) => handlePrilistaChange(index, e)}>
                        <option value="">Välj Mätplats</option>
                        <option value="Ishallen">Ishallen</option>
                        <option value="B-sidan">B-sidan</option>
                        <option value="A-sidan">A-sidan</option>
                    </select>
                </div>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <label htmlFor={`p-desc-${index}`}>Information</label>
                    <input id={`p-desc-${index}`} type="text" placeholder="Övrig info (kvalitet etc.)" name="description" value={prilista.description} onChange={(e) => handlePrilistaChange(index, e)}/>
                </div>
              </div>
              {prilistas.length > 0 && (
                <button type="button" className={`${styles.removeBtn} ${styles.removeBtnItem}`} onClick={() => removePrilista(index)}>
                  Ta bort Okantad Artikel #{index + 1}
                </button>
              )}
              {index < prilistas.length - 1 && <hr className={styles.itemSeparator} />}
            </div>
          ))}
          <button className={styles.addBtn} type="button" onClick={addPrilista}>
            Lägg till Okantad Artikel
          </button>
        </fieldset>

        {/* Kantlistas Section */}
        <fieldset className={styles.formSection}>
          <legend>Kantad</legend>
           {kantlistas.length === 0 && <p className={styles.emptyListNote}>Inga kantade artiklar tillagda.</p>}
          {kantlistas.map((kantlista, index) => (
            <div key={`kantlista-${index}`} className={styles.listItem}>
               <h4>Kantad Artikel #{index + 1}</h4>
               <div className={styles.itemInputs}>
                    <div className={styles.inputGroup}>
                        <label htmlFor={`k-antal-${index}`}>Antal *</label>
                        <input id={`k-antal-${index}`} type="number" placeholder="Antal pkt" name="antal" value={kantlista.antal} onChange={(e) => handleKantlistaChange(index, e)} required min="1"/>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor={`k-tjock-${index}`}>Tjocklek *</label>
                        <input id={`k-tjock-${index}`} type="text" placeholder="Ex. 63" name="tjocklek" value={kantlista.tjocklek} onChange={(e) => handleKantlistaChange(index, e)} required/>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor={`k-bredd-${index}`}>Bredd *</label>
                        <input id={`k-bredd-${index}`} type="text" placeholder="Ex. 150" name="bredd" value={kantlista.bredd} onChange={(e) => handleKantlistaChange(index, e)} required/>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor={`k-varv-${index}`}>Varv *</label>
                        <input id={`k-varv-${index}`} type="text" placeholder="Ex. 14" name="varv" value={kantlista.varv} onChange={(e) => handleKantlistaChange(index, e)} required/>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor={`k-maxl-${index}`}>Max Längd *</label>
                        <input id={`k-maxl-${index}`} type="text" placeholder="Ex. 4.8M" name="max_langd" value={kantlista.max_langd} onChange={(e) => handleKantlistaChange(index, e)} required/>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor={`k-stampel-${index}`}>Stämpel</label>
                        <input id={`k-stampel-${index}`} type="text" placeholder="Ex. SA*S" name="stampel" value={kantlista.stampel} onChange={(e) => handleKantlistaChange(index, e)}/>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor={`k-lager-${index}`}>Lagrad Plats</label>
                        <input id={`k-lager-${index}`} type="text" placeholder="Ex. JB 4h" name="lagerplats" value={kantlista.lagerplats} onChange={(e) => handleKantlistaChange(index, e)}/>
                    </div>
                    <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                        <label htmlFor={`k-info-${index}`}>Information</label>
                        <input id={`k-info-${index}`} placeholder="Övrig info..." name="information" value={kantlista.information} onChange={(e) => handleKantlistaChange(index, e)}/>
                    </div>
                    <div className={`${styles.inputGroup} ${styles.checkboxGroup}`}>
                        <label><input type="checkbox" name="status.kapad" checked={!!kantlista.status.kapad} onChange={(e) => handleKantlistaChange(index, e)}/>Kapad</label>
                        <label><input type="checkbox" name="status.klar" checked={!!kantlista.status.klar} onChange={(e) => handleKantlistaChange(index, e)}/>Klar</label>
                    </div>
               </div>
               {kantlistas.length > 0 && (
                 <button type="button" className={`${styles.removeBtn} ${styles.removeBtnItem}`} onClick={() => removeKantlista(index)}>
                   Ta bort Kantad Artikel #{index + 1}
                 </button>
               )}
               {index < kantlistas.length - 1 && <hr className={styles.itemSeparator} />}
            </div>
          ))}
          <button className={styles.addBtn} type="button" onClick={addKantlista}>
            Lägg till Kantad Artikel
          </button>
        </fieldset>

        {/* --- Klupplistas Section --- ADD THIS --- */}
        <fieldset className={styles.formSection}>
          <legend>Klupp</legend>
           {/* Conditionally render message if list is empty */}
           {klupplistas.length === 0 && <p className={styles.emptyListNote}>Inga klupplistor tillagda. Klicka nedan för att lägga till.</p>}
          {klupplistas.map((klupplista, index) => (
            <div key={`klupplista-${index}`} className={styles.listItem}>
               <h4>Klupp Artikel #{index + 1}</h4>
               {/* Add inputs corresponding to Klupplista Schema */}
               <div className={styles.itemInputs}>
                    {/* Required Fields */}
                    <div className={styles.inputGroup}>
                        <label htmlFor={`klupp-sagverk-${index}`}>Sågverk *</label>
                        <input id={`klupp-sagverk-${index}`} type="text" placeholder="Sågverk" name="sagverk" value={klupplista.sagverk} onChange={(e) => handleKlupplistaChange(index, e)} required/>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor={`klupp-dim-${index}`}>Dimension *</label>
                        <input id={`klupp-dim-${index}`} type="text" placeholder="Ex. 50x150" name="dimension" value={klupplista.dimension} onChange={(e) => handleKlupplistaChange(index, e)} required/>
                    </div>
                     <div className={styles.inputGroup}>
                        <label htmlFor={`klupp-maxl-${index}`}>Längd *</label>
                        <input id={`klupp-maxl-${index}`} type="text" placeholder="Ex. 5.3M" name="max_langd" value={klupplista.max_langd} onChange={(e) => handleKlupplistaChange(index, e)} required/>
                    </div>
                    {/* Other Fields */}
                     <div className={styles.inputGroup}>
                        <label htmlFor={`klupp-pkt-${index}`}>Pkt Nummer *</label>
                        <input id={`klupp-pkt-${index}`} type="text" placeholder="Ex. 345678" name="pktNumber" value={klupplista.pktNumber} onChange={(e) => handleKlupplistaChange(index, e)}/>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor={`klupp-sort-${index}`}>Träslag</label>
                        <input id={`klupp-sort-${index}`} type="text" placeholder="Ex. Furu/Gran" name="sort" value={klupplista.sort} onChange={(e) => handleKlupplistaChange(index, e)}/>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor={`klupp-stad-${index}`}>Märkning</label>
                        <input id={`klupp-stad-${index}`} type="text" placeholder="Ex. Södra Vi" name="stad" value={klupplista.stad} onChange={(e) => handleKlupplistaChange(index, e)}/>
                    </div>
                     <div className={styles.inputGroup}>
                        <label htmlFor={`klupp-magasin-${index}`}>Magasin</label>
                        <input id={`klupp-magasin-${index}`} type="text" placeholder="Ex. Kaj" name="magasin" value={klupplista.magasin} onChange={(e) => handleKlupplistaChange(index, e)}/>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor={`klupp-lager-${index}`}>Sida/Fack/Rad</label>
                        <input id={`klupp-lager-${index}`} type="text" placeholder="Ex. v/2/4" name="lagerplats" value={klupplista.lagerplats} onChange={(e) => handleKlupplistaChange(index, e)}/>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor={`klupp-lev-${index}`}>Lev. Datum</label>
                        <input id={`klupp-lev-${index}`} type="text" placeholder="Ex. 2025-12-20" name="leveransDatum" value={klupplista.leveransDatum} onChange={(e) => handleKlupplistaChange(index, e)}/>
                    </div>
                     {/* Status checkboxes (if user should set them - otherwise handle on backend) */}
                     {/* <div className={`${styles.inputGroup} ${styles.checkboxGroup}`}>
                        <label><input type="checkbox" name="status.klar" checked={!!klupplista.status.klar} onChange={(e) => handleKlupplistaChange(index, e)}/>Klar</label>
                        <label><input type="checkbox" name="status.ej_Klar" checked={!!klupplista.status.ej_Klar} onChange={(e) => handleKlupplistaChange(index, e)}/>Ej Klar</label>
                    </div> */}
                    <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                        <label htmlFor={`klupp-info-${index}`}>Information</label>
                        <input id={`klupp-info-${index}`} placeholder="Övrig info..." name="information" value={klupplista.information} onChange={(e) => handleKlupplistaChange(index, e)}/>
                    </div>
               </div>
               {/* Button to remove this specific klupplista item */}
               {klupplistas.length > 0 && (
                 <button
                   type="button"
                   className={`${styles.removeBtn} ${styles.removeBtnItem}`}
                   onClick={() => removeKlupplista(index)}
                 >
                   Ta bort Klupp Artikel #{index + 1}
                 </button>
               )}
               {index < klupplistas.length - 1 && <hr className={styles.itemSeparator} />}
            </div>
          ))}
          {/* Button to add a new klupplista item */}
          <button className={styles.addBtn} type="button" onClick={addKlupplista}>
            Lägg till Klupp Artikel
          </button>
        </fieldset>
        {/* --- END OF KLUPPLISTA SECTION --- */}

        <button className={styles.submitBtn} type="submit">Skapa order</button>
      </form>
    </div>
  );
};

export default CreateOrder;
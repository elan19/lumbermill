import React, { useState } from 'react';
import axios from 'axios';
import styles from './CreateOrder.module.css';

const CreateOrder = ({ }) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [customer, setCustomer] = useState('');
  const [delivery, setDelivery] = useState('');
  const [notes, setNotes] = useState('');
  const [prilistas, setPrilistas] = useState([
    { quantity: 1, size: '', type: '', dimension: '', location: '', description: '', measureLocation: '' },
  ]);
  const [kantlistas, setKantlistas] = useState([
    { 
      antal: 1,
      bredd: '', 
      tjocklek: '', 
      varv: '', 
      max_langd: '', 
      stampel: '', 
      lagerplats: '', 
      information: '', 
      status: { kapad: false, klar: false },
    },
  ]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const token = localStorage.getItem('token');

  const handlePrilistaChange = (index, field, value) => {
    const updatedPrilistas = [...prilistas];
    updatedPrilistas[index][field] = value;
    setPrilistas(updatedPrilistas);
  };

  const addPrilista = () => {
    setPrilistas([
      ...prilistas,
      { quantity: 1, size: '', type: '', dimension: '', location: '', description: '', measureLocation: '' },
    ]);
  };

  const removePrilista = (index) => {
    setPrilistas(prilistas.filter((_, i) => i !== index));
  };

  const handleKantlistaChange = (index, field, value) => {
    const updatedKantlistas = [...kantlistas];
    if (field.includes('status.')) {
      const statusField = field.split('.')[1];
      updatedKantlistas[index].status[statusField] = value;
    } else {
      updatedKantlistas[index][field] = value;
    }
    setKantlistas(updatedKantlistas);
  };

  const addKantlista = () => {
    setKantlistas([
      ...kantlistas,
      { 
        antal: 1,
        bredd: '', 
        tjocklek: '', 
        varv: '', 
        max_langd: '', 
        stampel: '', 
        lagerplats: '', 
        information: '', 
        status: { kapad: false, klar: false },
      },
    ]);
  };

  const removeKantlista = (index) => {
    setKantlistas(kantlistas.filter((_, i) => i !== index));
  };  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/orders/create`, {
        orderNumber,
        customer,
        delivery,
        notes: notes ? [notes] : [],
        prilistas,
        kantlistas,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // Add the token from localStorage
        },
      });

      if (response.status !== 201) {
        throw new Error('Failed to create order');
      }

      setSuccess(true);
      //onOrderCreated(response.data);
      // Reset form fields
      setOrderNumber('');
      setCustomer('');
      setDelivery('');
      setNotes('');
      setPrilistas([{ quantity: 1, size: '', type: '', dimension: '', location: '', description: '', measureLocation: '' }]);
      setKantlistas([{
        antal: 1, 
        bredd: '', 
        tjocklek: '', 
        varv: '', 
        max_langd: '', 
        stampel: '', 
        lagerplats: '', 
        information: '', 
        status: { kapad: false, klar: false }
      }]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Misslyckades att skapa ordern!');
    }
  };

  return (
    <div className={styles.createOrder}>
      <h2>Skapa Order</h2>
      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.success}>Order skapades!</div>}
      <form className={styles.form} onSubmit={handleSubmit}>
        <label>Order nummer</label>
        <input type="number" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} required />
        <label>Kund</label>
        <input type="text" value={customer} onChange={(e) => setCustomer(e.target.value)} required />
        <label>Leveranstid</label>
        <input type="text" value={delivery} onChange={(e) => setDelivery(e.target.value)} />
        <label>Anteckningar</label>
        <textarea value={notes} className={styles.textareaTest} rows="3" onChange={(e) => setNotes(e.target.value)} />
        
        {/* Prilistas Section */}
        <div className={styles.formGroup}>
          <h3>Okantad</h3>
          {prilistas.map((prilista, index) => (
            <div key={index} className={styles.prilistaItem}>
              <input
                type="number"
                placeholder="Antal"
                value={prilista.quantity}
                onChange={(e) => handlePrilistaChange(index, 'quantity', e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Dimension"
                value={prilista.dimension}
                onChange={(e) => handlePrilistaChange(index, 'dimension', e.target.value)}
              />
              <input
                type="text"
                placeholder="Storlek"
                value={prilista.size}
                onChange={(e) => handlePrilistaChange(index, 'size', e.target.value)}
              />
              <input
                type="text"
                placeholder="Trätyp"
                value={prilista.type}
                onChange={(e) => handlePrilistaChange(index, 'type', e.target.value)}
              />
              <input
                type="text"
                placeholder="Lagerplats"
                value={prilista.location}
                onChange={(e) => handlePrilistaChange(index, 'location', e.target.value)}
              />
              <input
                type="text"
                placeholder="Information"
                value={prilista.description}
                onChange={(e) => handlePrilistaChange(index, 'description', e.target.value)}
              />
              <select
                className={styles.selectOrder}
                value={prilista.measureLocation}
                onChange={(e) => handlePrilistaChange(index, 'measureLocation', e.target.value)}
              >
                <option value="">Välj Mätplats</option>
                <option value="Ishallen">Ishallen</option>
                <option value="B-sidan">B-sidan</option>
                <option value="A-sidan">A-sidan</option>
              </select>
              {prilistas.length > 0 && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removePrilista(index)}
                >
                  Ta bort
                </button>
              )}
            </div>
          ))}
          <button className={styles.addBtn} type="button" onClick={addPrilista}>
            Lägg till okantat
          </button>
        </div>

        {/* Kantlistas Section */}
        <div className={styles.formGroup}>
          <h3>Kantad</h3>
          {kantlistas.map((kantlista, index) => (
            <div key={index} className={styles.kantlistaItem}>
              <input
                type="number"
                placeholder="Antal"
                value={kantlista.antal}
                onChange={(e) => handleKantlistaChange(index, 'antal', e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Tjocklek"
                value={kantlista.tjocklek}
                onChange={(e) => handleKantlistaChange(index, 'tjocklek', e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Bredd"
                value={kantlista.bredd}
                onChange={(e) => handleKantlistaChange(index, 'bredd', e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Varv"
                value={kantlista.varv}
                onChange={(e) => handleKantlistaChange(index, 'varv', e.target.value)}
              />
              <input
                type="text"
                placeholder="Max Längd"
                value={kantlista.max_langd}
                onChange={(e) => handleKantlistaChange(index, 'max_langd', e.target.value)}
              />
              <input
                type="text"
                placeholder="Stämpel"
                value={kantlista.stampel}
                onChange={(e) => handleKantlistaChange(index, 'stampel', e.target.value)}
              />
              <input
                type="text"
                placeholder="Lagerplats"
                value={kantlista.lagerplats}
                onChange={(e) => handleKantlistaChange(index, 'lagerplats', e.target.value)}
              />
              <input
                placeholder="Information"
                value={kantlista.information}
                onChange={(e) => handleKantlistaChange(index, 'information', e.target.value)}
              />
              <div className={styles.kantListaCheckBtnDiv}>
                <label>
                  Kapad
                  <input
                    type="checkbox"
                    checked={kantlista.status.kapad}
                    onChange={(e) => handleKantlistaChange(index, 'status.kapad', e.target.checked)}
                  />
                </label>
                <label>
                  Klar
                  <input
                    type="checkbox"
                    checked={kantlista.status.klar}
                    onChange={(e) => handleKantlistaChange(index, 'status.klar', e.target.checked)}
                  />
                </label>
              </div>
              <button
                type="button"
                className={styles.removeBtnKantlista}
                onClick={() => removeKantlista(index)}
              >
                Ta bort
              </button>
            </div>
          ))}
          <button className={styles.addBtn} type="button" onClick={addKantlista}>
            Lägg till kantat
          </button>
        </div>

        <button className={styles.submitBtn} type="submit">
          Skapa order
        </button>
      </form>
    </div>
  );
};

export default CreateOrder;

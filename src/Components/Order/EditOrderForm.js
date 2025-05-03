import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './EditFormOrder.module.css';

const EditOrderForm = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);
  const [prilistaDetails, setPrilistaDetails] = useState([]);
  const [kantListaDetails, setKantListaDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedItems, setExpandedItems] = useState({ prilista: {}, kantlista: {} });
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchOrderDetails();
  }, [orderNumber]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/${orderNumber}?expandPrilista=true`, {
        headers: {
          Authorization: `Bearer ${token}`, // Add token to Authorization header
        },
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      const data = await response.json();
      setOrderDetails(data);
      setPrilistaDetails(data.prilista);
      setKantListaDetails(data.kantlista || []);
      //console.log(data.kantlista);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrderDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handlePrilistaChange = (index, e) => {
    const { name, value } = e.target;
    const updatedPrilista = [...prilistaDetails];
    updatedPrilista[index] = {
      ...updatedPrilista[index],
      [name]: value, // Convert the string 'true' to the Boolean true
    };
    setPrilistaDetails(updatedPrilista);
    //console.log(prilistaDetails);
  };

  const handleKantListaChange = (index, e, field = null) => {
    const { name, value } = e.target;
  
    setKantListaDetails((prevData) => {
      const newData = [...prevData];
  
      if (field) {
        // If 'field' is passed, update a nested 'status' field (kapad, klar)
        newData[index].status[field] = value === "true"; // Convert string to boolean
      } else {
        // Otherwise, update a top-level field
        newData[index][name] = value; // Dynamically update by input 'name' attribute
      }
  
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const orderResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/${orderNumber}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
         },
        body: JSON.stringify(orderDetails),
      });

      if (!orderResponse.ok) {
        throw new Error(`Error: ${orderResponse.status} - ${orderResponse.statusText}`);
      }

      await Promise.all(
        prilistaDetails.map((item) =>
          fetch(`${process.env.REACT_APP_API_URL}/api/prilista/edit/${item._id}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
             },
            body: JSON.stringify(item),
          })
        )
      );

      await Promise.all(
        kantListaDetails.map((item) =>
          fetch(`${process.env.REACT_APP_API_URL}/api/kantlista/edit/${item._id}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`, },
            body: JSON.stringify(item),
          })
        )
      );

      //alert('Order and PriLista and Kantlista details updated successfully');
      navigate(`/dashboard/order-detail/${orderNumber}`);
    } catch (err) {
      console.error('Failed to update order and PriLista details:', err);
      setError(err.message);
    }
  };

  /*const toggleExpanded = (index) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index], // Toggle the specific item's expanded state
    }));
  };*/

  const toggleExpanded = (listType, index) => {
    //console.log(listType);
    //console.log(index);
    setExpandedItems((prev) => ({
      ...prev,
      [listType]: {
        ...prev[listType],
        [index]: !prev[listType]?.[index], // Safely access the expanded state
      },
    }));
  };

  const deletePrilista = async (prilistaId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/prilista/${prilistaId}`,{
        headers: {
          Authorization: `Bearer ${token}`, // Add token to Authorization header
        },
      });
      fetchOrderDetails();
    } catch (err) {
      console.error('Failed to remove prilista:', err);
    }
  }

  const deleteKantlista = async (kantlistaId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/kantlista/${kantlistaId}`,{
        headers: {
          Authorization: `Bearer ${token}`, // Add token to Authorization header
        },
      });
      fetchOrderDetails();
    } catch (err) {
      console.error('Failed to remove kantlista:', err);
    }
  }

  if (loading) {
    return <p className={styles.loading}>Loading order details...</p>;
  }

  if (error) {
    return <p className={styles.error}>Error: {error}</p>;
  }

  return (
    <div className={styles.editOrderForm}>
      <h2>Redigera Order</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="orderNumber">Ordernummer:</label>
          <input
            type="text"
            id="orderNumber"
            name="orderNumber"
            value={orderDetails.orderNumber || ''}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="customer">Köpare:</label>
          <input
            type="text"
            id="customer"
            name="customer"
            value={orderDetails.customer || ''}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="delivery">Avrop:</label>
          <input
            type="text"
            id="delivery"
            name="delivery"
            value={orderDetails.delivery || ''}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="status">Status:</label>
          <select
            id="status"
            name="status"
            value={orderDetails.status || ''}
            onChange={handleChange}
            required
            className={styles.select}
          >
            {['In Progress', 'Completed'].map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {statusOption}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="notes">Info om order:</label>
          <textarea
            id="notes"
            name="notes"
            value={orderDetails.notes || ''}
            onChange={handleChange}
            className={styles.textarea}
          />
        </div>

        <h3>Prilistor</h3>
        {prilistaDetails.map((prilistaItem, index) => (
        <div
          key={index}
          className={`${styles.prilistaItem} ${prilistaItem.completed ? styles.completed : ''}`}
        >
          <h3>
            Prilista {index + 1} - 
            {prilistaItem.completed && (
              <span className={styles.completedBadge}>Avklarad</span>
            )}
          </h3>
          <div className={styles.detailAndRemoveBtnDiv}>
            <button
              type="button"
              onClick={() => toggleExpanded('prilista', index)}
              className={styles.toggleButton}
            >
              {expandedItems.prilista && expandedItems.prilista[index] ? 'Dölj detaljer' : 'Visa detaljer'}
            </button>
            <button onClick={() => deletePrilista(prilistaItem._id)}
              className={styles.deleteButton}>
              X
            </button>
          </div>
          {expandedItems.prilista && expandedItems.prilista[index] && (
            <div className={styles.details}>
              <label htmlFor={`prilista-${index}-quantity`}>Antal:</label>
              <input
                type="number"
                id={`prilista-${index}-quantity`}
                name="quantity"
                value={prilistaItem.quantity || ''}
                onChange={(e) => handlePrilistaChange(index, e)}
                className={styles.input}
              />
              <label htmlFor={`prilista-${index}-dimension`}>Dimension (mm):</label>
              <input
                type="text"
                id={`prilista-${index}-dimension`}
                name="dimension"
                value={prilistaItem.dimension || ''}
                onChange={(e) => handlePrilistaChange(index, e)}
                className={styles.input}
              />
              <label htmlFor={`prilista-${index}-size`}>Storlek:</label>
              <input
                type="text"
                id={`prilista-${index}-size`}
                name="size"
                value={prilistaItem.size || ''}
                onChange={(e) => handlePrilistaChange(index, e)}
                className={styles.input}
              />
              <label htmlFor={`prilista-${index}-type`}>Träslag:</label>
              <input
                type="text"
                id={`prilista-${index}-type`}
                name="type"
                value={prilistaItem.type || ''}
                onChange={(e) => handlePrilistaChange(index, e)}
                className={styles.input}
              />
              <label htmlFor={`prilista-${index}-description`}>Information:</label>
              <input
                type="text"
                id={`prilista-${index}-description`}
                name="description"
                value={prilistaItem.description || ''}
                onChange={(e) => handlePrilistaChange(index, e)}
                className={styles.input}
              />
              <label htmlFor={`prilista-${index}-location`}>Lagerplats:</label>
              <input
                type="text"
                id={`prilista-${index}-location`}
                name="location"
                value={prilistaItem.location || ''}
                onChange={(e) => handlePrilistaChange(index, e)}
                className={styles.input}
              />
              <label htmlFor={`prilista-${index}-completed`}>Avklarad:</label>
              <select
                id={`prilista-${index}-completed`}
                name="completed"
                value={prilistaItem.completed !== undefined ? prilistaItem.completed : ''}
                onChange={(e) => handlePrilistaChange(index, e)}
                className={styles.select}
              >
                {[
                  { value: true, displayText: 'Sant' },
                  { value: false, displayText: 'Falskt' },
                ].map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.displayText}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        ))}
        {/* KantLista Details */}
        <h3>Kantlista</h3>
        {kantListaDetails.map((kantListaItem, index) => (
        <div
          className={`${styles.kantListItem} ${kantListaItem.status.klar && kantListaItem.status.kapad ? styles.completed : ''}`}
          key={index}
        >
          <h3>
            Kantlista {index + 1} -
            {kantListaItem.status.klar && kantListaItem.status.kapad && (
              <span className={styles.completedBadge}>Avklarad</span>
            )}
          </h3>
          <div className={styles.detailAndRemoveBtnDiv}>
            <button
              type="button"
              onClick={() => toggleExpanded('kantlista', index)}
              className={styles.toggleButton}
            >
              {expandedItems.kantlista && expandedItems.kantlista[index] ? 'Dölj detaljer' : 'Visa detaljer'}
            </button>
            <button onClick={() => deleteKantlista(kantListaItem._id)}
              className={styles.deleteButton}>
              X
            </button>
          </div>
          {expandedItems.kantlista && expandedItems.kantlista[index] && (
          <div className={styles.details}>
            <label htmlFor={`kantlista-${index}-antal`}>Antal:</label>
            <input
              type="number"
              id={`kantlista-${index}-antal`}
              name="antal"
              value={kantListaItem.antal || ''}
              onChange={(e) => handleKantListaChange(index, e)}
              className={styles.input}
            />
            <label htmlFor={`kantlista-${index}-tjocklek`}>Dimension (mm):</label>
            <input
              type="text"
              id={`kantlista-${index}-tjocklek`}
              name="tjocklek"
              value={kantListaItem.tjocklek || ''}
              onChange={(e) => handleKantListaChange(index, e)}
              className={styles.input}
            />
            <label htmlFor={`kantlista-${index}-bredd`}>Bredd:</label>
            <input
              type="text"
              id={`kantlista-${index}-bredd`}
              name="bredd"
              value={kantListaItem.bredd || ''}
              onChange={(e) => handleKantListaChange(index, e)}
              className={styles.input}
            />
            <label htmlFor={`kantlista-${index}-varv`}>Varv:</label>
            <input
              type="text"
              id={`kantlista-${index}-varv`}
              name="varv"
              value={kantListaItem.varv || ''}
              onChange={(e) => handleKantListaChange(index, e)}
              className={styles.input}
            />
            <label htmlFor={`kantlista-${index}-max_langd`}>Max längd:</label>
            <input
              type="text"
              id={`kantlista-${index}-max_langd`}
              name="max_langd"
              value={kantListaItem.max_langd || ''}
              onChange={(e) => handleKantListaChange(index, e)}
              className={styles.input}
            />
            <label htmlFor={`kantlista-${index}-stampel`}>Stämpel:</label>
            <input
              type="text"
              id={`kantlista-${index}-stampel`}
              name="stampel"
              value={kantListaItem.stampel || ''}
              onChange={(e) => handleKantListaChange(index, e)}
              className={styles.input}
            />
            <label htmlFor={`kantlista-${index}-lagerplats`}>Lagerplats:</label>
            <input
              type="text"
              id={`kantlista-${index}-lagerplats`}
              name="lagerplats"
              value={kantListaItem.lagerplats || ''}
              onChange={(e) => handleKantListaChange(index, e)}
              className={styles.input}
            />
            <label htmlFor={`kantlista-${index}-information`}>Information:</label>
            <input
              type="text"
              id={`kantlista-${index}-information`}
              name="information"
              value={kantListaItem.information || ''}
              onChange={(e) => handleKantListaChange(index, e)}
              className={styles.input}
            />
            <label htmlFor={`kantlista-${index}-status-kapad`}>Kapad:</label>
            <select
              id={`kantlista-${index}-status-kapad`}
              name="status-kapad"
              value={kantListaItem.status.kapad ? "true" : "false"}
              onChange={(e) => handleKantListaChange(index, e, 'kapad')}
              className={styles.select}
            >
              <option value="true">Sant</option>
              <option value="false">Falskt</option>
            </select>

            <label htmlFor={`kantlista-${index}-status-klar`}>Klar:</label>
            <select
              id={`kantlista-${index}-status-klar`}
              name="status-klar"
              value={kantListaItem.status.klar ? "true" : "false"}
              onChange={(e) => handleKantListaChange(index, e, 'klar')}
              className={styles.select}
            >
              <option value="true">Sant</option>
              <option value="false">Falskt</option>
            </select>
          </div>
          )}
        </div>
        ))}

        <button type="submit" className={styles.submitButton}>Spara Ändringar</button>
      </form>
    </div>
  );
};

export default EditOrderForm;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./NewPrilista.module.css"; // Ensure this path is correct

import { useAuth } from '../../../contexts/AuthContext';

const CreatePrilista = () => {
  const [orders, setOrders] = useState([]);
  const [orderNumber, setOrderNumber] = useState("");
  const [customer, setCustomer] = useState("");
  const [quantity, setQuantity] = useState(""); // Keep as string for input, parse on submit
  const [size, setSize] = useState("");
  const [type, setType] = useState("FURU");
  const [dimension, setDimension] = useState("");
  const [description, setDescription] = useState("");
  const [measureLocation, setMeasureLocation] = useState("");
  const [isLager, setIsLager] = useState(false);
  const [isItemActive, setIsItemActive] = useState(false);
  const [pktNr, setPktNr] = useState("");
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const { hasPermission } = useAuth();
  const shouldForceLager = !hasPermission('orders', 'create');

  useEffect(() => {
    if (shouldForceLager) {
        setIsLager(true);
    }
  }, [shouldForceLager]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const filteredOrders = response.data.filter(order => order.status !== "Delivered");
        setOrders(filteredOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to fetch orders. Please try again later.");
      }
    };

    if (token) {
      fetchOrders();
    } else {
      setError("Authentication required.");
      // Consider navigating to login if no token
      // navigate('/login');
    }
  }, [token]); // Removed navigate from here if not used directly in this effect's cleanup

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const finalCustomer = isLager || shouldForceLager ? "Lager" : customer;
    const finalQuantity = isLager || shouldForceLager ? 1 : (quantity ? parseInt(quantity, 10) : 0);

    // Validation
    if (!isLager && !shouldForceLager && !finalCustomer) { // Corrected condition for customer
        setError("Kund är obligatoriskt när 'Lager' inte är valt.");
        return;
    }
    // Order number validation (only if not lager/forceLager)
    if (!isLager && !shouldForceLager && (!orderNumber || isNaN(parseInt(orderNumber, 10)))) {
        setError("Ordernummer är obligatoriskt och måste vara ett nummer när 'Lager' inte är valt.");
        return;
    }
    if (!finalQuantity || !size || !dimension || !type) {
        setError("Antal, Dimension, Storlek och Träslag är obligatoriska fält.");
        return;
    }

    const newPrilista = {
      orderNumber: isLager || shouldForceLager ? null : parseInt(orderNumber, 10),
      customer: finalCustomer,
      quantity: finalQuantity,
      size,
      type,
      dimension,
      location: "-", // Default or make it an optional input
      description,
      measureLocation,
      isLager: isLager || shouldForceLager,
      pktNr, // Ensure pktNr is a number or null
      // --- CORRECTED ACTIVE LOGIC ---
      active: isLager || shouldForceLager ? true : isItemActive
    };

    console.log("Submitting new Prilista:", newPrilista); // For debugging

    try {
        // --- Your API call to submit newPrilista ---
        const token = localStorage.getItem('token');
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/prilista/create`, newPrilista, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        console.log("Prilista item created:", response.data);
        // Optionally: clear form, show success message, navigate, or refresh list
        // Example:
        // clearForm(); // You'd need to create this function
        // alert("Prilista artikel skapad!");
        navigate('/dashboard/prilista'); // If you want to navigate away

    } catch (apiError) {
        console.error("Error submitting Prilista:", apiError.response?.data || apiError.message);
        setError(apiError.response?.data?.message || "Kunde inte skapa Prilista artikel.");
    }
};

  const handleOrderSelect = (selectedOrderValue) => {
    if (isLager) return;

    if (selectedOrderValue) {
      const selectedOrder = orders.find(order => String(order.orderNumber) === selectedOrderValue);
      if (selectedOrder) {
        setOrderNumber(String(selectedOrder.orderNumber));
        setCustomer(selectedOrder.customer);
      } else {
        setOrderNumber(selectedOrderValue); // Allow manual input if not found
        setCustomer(""); // Clear customer if order not found in list
      }
    } else {
      setOrderNumber("");
      setCustomer("");
    }
    // Reset item-specific fields
    setQuantity("");
    setSize("");
    setType("FURU");
    setIsItemActive(false);
    setDimension("");
    setDescription("");
    setMeasureLocation("");
    setPktNr("");
  };

  return (
    <div className={styles.newPrilistaContainer}>
      <h2>Skapa ny Okantad</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <p className={styles.errorMessage}>{error}</p>}

        <div className={styles.formGroupCheckbox}>
            <label htmlFor="isLagerCheckboxPrilista" className={styles.lagerLabel}>
              <input
                  type="checkbox"
                  id="isLagerCheckboxPrilista"
                  checked={isLager || shouldForceLager} //  Always checked if shouldForceLager
                  onChange={(e) => {
                      // Only allow the user to change the setting if they have permission
                      if (!shouldForceLager) {
                          setIsLager(e.target.checked);
                      }
                  }}
                  disabled={shouldForceLager} // Disable if shouldForceLager
              />
              Lager
          </label>
        </div>

        {/* Conditionally render Order selection and fields */}
        {!isLager && (
          <>
            <label htmlFor="orderSelectPrilista">Välj Order: <span className={styles.optional}>(Frivillig)</span></label>
            <select
              id="orderSelectPrilista"
              className={styles.selectOrder}
              onChange={(e) => handleOrderSelect(e.target.value)}
              value={orderNumber}
              disabled={isLager}
            >
              <option value="">-- Välj aktiv order --</option>
              {orders.map((order) => (
                <option key={order._id} value={String(order.orderNumber)}>
                  {order.orderNumber} - {order.customer}
                </option>
              ))}
            </select>

            <label htmlFor="orderNumberPrilista">Ordernummer: *</label>
            <input
              type="number" // Changed to number for better input
              id="orderNumberPrilista"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required={!isLager}
              disabled={isLager}
              className={styles.inputField}
            />

            <label htmlFor="customerPrilista">Kund: *</label>
            <input
              type="text"
              id="customerPrilista"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              required={!isLager}
              disabled={isLager}
              className={styles.inputField}
            />
            
            <label htmlFor="quantityPrilista">Antal: *</label>
            <input
              type="number"
              id="quantityPrilista"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              disabled={isLager} // Quantity input is disabled if "Lager"
              className={styles.inputField}
              placeholder="Antal paket"
            />
          </>
        )}

        <label htmlFor="dimensionPrilista">Dimension (Tjocklek): *</label>
        <input
          type="text" // Keep as text if format can vary (e.g., "50", "2 tum")
          id="dimensionPrilista"
          value={dimension}
          onChange={(e) => setDimension(e.target.value)}
          required
          className={styles.inputField}
          placeholder="T.ex. 50"
        />

        <label htmlFor="sizePrilista">Storlek (Bredd/Info): *</label>
        <input
          type="text"
          id="sizePrilista"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          required
          className={styles.inputField}
          placeholder="T.ex. Sidor, 4x, Breda"
        />

        <label htmlFor="typePrilista">Träslag: *</label>
        <select
          id="typePrilista"
          value={type} // The current selected value, managed by your 'type' state
          onChange={(e) => setType(e.target.value)} // Update the 'type' state when an option is selected
          required
          className={styles.selectOrder} // You can reuse your existing inputField style or create a new one for selects
        >
          <option value="FURU">FURU</option> {/* Optional: Default placeholder option */}
          <option value="GRAN">GRAN</option>
          {/* You can add more options here if needed in the future */}
          {/* <option value="LÄRK">LÄRK</option> */}
          {/* <option value="ANNAT">ANNAT (Specify below)</option> */}
        </select>

        {!(isLager || shouldForceLager) && (
          <div className={styles.inputGroup}> {/* Or your preferred styling class */}
            <label htmlFor="itemActiveSelect">Aktiv i Mätlista:</label>
            <select
            className={styles.selectOrder}
              id="itemActiveSelect"
              value={isItemActive ? 'true' : 'false'} // Reflect the boolean state as string values
              onChange={(e) => setIsItemActive(e.target.value === 'true')} // Convert back to boolean on change
              // className={styles.selectField} // Your class for select elements
            >
              <option value="false">Nej</option> {/* Default to Nej */}
              <option value="true">Ja</option>
            </select>
          </div>
        )}

        <label htmlFor="pktNrPrilista">Paketnummer: </label>
        <input
          type="number"
          id="pktNrPrilista"
          value={pktNr}
          onChange={(e) => setPktNr(e.target.value)}
          className={styles.inputField}
          placeholder="T.ex. 30"
        />

        <label htmlFor="measureLocationPrilista">Mätplats: <span className={styles.optional}>(Frivillig)</span></label>
        <select
          id="measureLocationPrilista"
          className={styles.selectOrder}
          value={measureLocation}
          onChange={(e) => setMeasureLocation(e.target.value)}
        >
          <option value="">Välj Mätplats</option>
          <option value="Ishallen">Ishallen</option>
          <option value="B-sidan">B-sidan</option>
          <option value="A-sidan">A-sidan</option>
        </select>

        <label htmlFor="descriptionPrilista" className={styles.textareaLabel}>Information: <span className={styles.optional}>(Frivillig)</span></label>
        <textarea
          id="descriptionPrilista"
          rows="4"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.textareaField}
        />

        <button type="submit" className={styles.submitButton}>Skapa OKANTAD</button>
      </form>
    </div>
  );
};

export default CreatePrilista;
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import axios from 'axios';
import styles from './EditFormOrder.module.css';
// Import the new layout components we will create
import EditOrderFormNewLayout from './EditOrderFormNewLayout';
import EditOrderFormOldLayout from './EditOrderFormOldLayout';

import { useAuth } from '../../contexts/AuthContext';

const EditOrderForm = () => {
    const { orderNumber } = useParams();
    const navigate = useNavigate();
    const [orderDetails, setOrderDetails] = useState(null);
    const [prilistaDetails, setPrilistaDetails] = useState([]);
    const [kantListaDetails, setKantListaDetails] = useState([]);
    const [klupplistaDetails, setKlupplistaDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedItems, setExpandedItems] = useState({ prilista: {}, kantlista: {}, klupplista: {} });
    // State for the GENERAL website design (might not be needed here anymore, but keep for now)
    // const [designSetting, setDesignSetting] = useState('new');
    // State specifically for the ORDER FORM design <-- ADD THIS
    const [orderDesignSetting, setOrderDesignSetting] = useState('new'); // Default to 'new'
    const token = localStorage.getItem('token');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // State for modal visibility
    const [modalMessage, setModalMessage] = useState(''); // Message for the modal
    const [isDeleting, setIsDeleting] = useState(false); 
    const [modalMode, setModalMode] = useState('confirm');

    const { user, hasPermission, isLoadingAuth } = useAuth();

    useEffect(() => {
        if (!isLoadingAuth && !hasPermission('orders', 'update')) {
            navigate('/dashboard'); // Redirect to dashboard or appropriate route
        }
    }, [user, hasPermission, isLoadingAuth, navigate]);

    // Fetch BOTH order details and user settings
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        if (!token) {
            setError("Authentication token not found. Please log in.");
            setLoading(false);
            navigate('/login');
            return;
        }

        try {
            // Use Promise.all to fetch concurrently
            const [orderRes, settingsRes] = await Promise.all([
                 axios.get(`${process.env.REACT_APP_API_URL}/api/orders/${orderNumber}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                 axios.get(`${process.env.REACT_APP_API_URL}/api/auth/settings`, {
                     headers: { Authorization: `Bearer ${token}` }
                 })
            ]);

            const orderData = orderRes.data;

            // Fetch related lists separately
             const [prilistaRes, kantlistaRes, klupplistaRes] = await Promise.all([
                 axios.get(`${process.env.REACT_APP_API_URL}/api/prilista/order/${orderData.orderNumber}`, {
                     headers: { Authorization: `Bearer ${token}` }
                 }),
                 axios.get(`${process.env.REACT_APP_API_URL}/api/kantlista/order/${orderData.orderNumber}`, {
                     headers: { Authorization: `Bearer ${token}` }
                 }),
                 axios.get(`${process.env.REACT_APP_API_URL}/api/klupplista/order/${orderData.orderNumber}`, 
                    { headers: { Authorization: `Bearer ${token}` } 
                }),
             ]);

            setOrderDetails(orderData);
            setPrilistaDetails(prilistaRes.data || []);
            setKantListaDetails(kantlistaRes.data || []);
            setKlupplistaDetails(klupplistaRes.data || []);

            // Set the ORDER design setting from fetched data <-- UPDATE THIS
            setOrderDesignSetting(settingsRes.data?.orderDesign || 'new'); // Use orderDesign field
            // Optionally set the general design setting if needed elsewhere
            // setDesignSetting(settingsRes.data?.design || 'new');

        } catch (err) {
            console.error('Failed to fetch data:', err);
            let errorMessage = 'Failed to fetch data.';
            if (err.response) {
                errorMessage = `Error ${err.response.status}: ${err.response.data.message || err.message}`;
                if (err.response.status === 401 || err.response.status === 403) {
                    localStorage.removeItem('token');
                    navigate('/login');
                    setLoading(false);
                    return;
                }
            } else if (err.request) {
                errorMessage = 'Network error or server did not respond.';
            } else {
                errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderNumber, token, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Handlers remain the same ---
     const handleChange = (e) => {
        const { name, value } = e.target;
        setOrderDetails((prevDetails) => ({ ...prevDetails, [name]: value, }));
    };
    const handlePrilistaChange = (index, e) => {
        const { name, value, type, checked } = e.target;
        setPrilistaDetails((prev) => {
             const updatedPrilista = [...prev];
             const currentItem = updatedPrilista[index];
             let newValue = type === 'checkbox' ? checked : (name === 'completed' && (value === 'true' || value === 'false')) ? value === 'true' : value;
             updatedPrilista[index] = { ...currentItem, [name]: newValue };
             return updatedPrilista;
        });
    };
    const handleKantListaChange = (index, e) => {
        const { name, value, type, checked } = e.target;
         setKantListaDetails((prev) => {
            const updatedKantLista = [...prev];
            const currentItem = updatedKantLista[index];
            if (name.startsWith('status.')) {
                const statusField = name.split('.')[1];
                let newValue = type === 'checkbox' ? checked : (value === 'true' || value === 'false') ? value === 'true' : value;
                updatedKantLista[index] = { ...currentItem, status: { ...currentItem.status, [statusField]: newValue } };
            } else {
                updatedKantLista[index] = { ...currentItem, [name]: value };
            }
            return updatedKantLista;
         });
    };
    // --- ADD HANDLER FOR KLUPPLISTA ---
    const handleKlupplistaChange = (index, e) => {
        const { name, value, type, checked } = e.target;
        setKlupplistaDetails((prev) => {
             const updatedKlupplista = [...prev];
             const currentItem = updatedKlupplista[index];
             const newValue = type === 'checkbox' ? checked : value;

             // Handle status object if it exists in the input name
             if (name.startsWith('status.')) {
                 const statusField = name.split('.')[1];
                 updatedKlupplista[index] = {
                     ...currentItem,
                     status: { ...currentItem.status, [statusField]: newValue }
                 };
             } else {
                 updatedKlupplista[index] = { ...currentItem, [name]: newValue };
             }
             return updatedKlupplista;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(null); setLoading(true);
        try {
            const orderPayload = { ...orderDetails };
            await axios.put(`${process.env.REACT_APP_API_URL}/api/orders/${orderNumber}`, orderPayload, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
            await Promise.all(prilistaDetails.map((item) => axios.put(`${process.env.REACT_APP_API_URL}/api/prilista/edit/${item._id}`, item, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } })));
            await Promise.all(kantListaDetails.map((item) => axios.put(`${process.env.REACT_APP_API_URL}/api/kantlista/edit/${item._id}`, item, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } })));
            await Promise.all(klupplistaDetails.map((item) => axios.put(`${process.env.REACT_APP_API_URL}/api/klupplista/${item._id}`, item, // Assuming PUT /api/klupplista/:id exists
                { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } })));
            navigate(`/dashboard/order-detail/${orderNumber}`);
        } catch (err) {
            console.error('Failed to update:', err);
             let errorMessage = 'Failed to update order.';
             if (err.response) { errorMessage = `Error ${err.response.status}: ${err.response.data.message || err.message}`; if (err.response.status === 401 || err.response.status === 403) { localStorage.removeItem('token'); navigate('/login'); }}
             else if (err.request) { errorMessage = 'Network error.'; } else { errorMessage = err.message; }
             setError(errorMessage);
        } finally { setLoading(false); }
    };
    const toggleExpanded = (listType, index) => { setExpandedItems((prev) => ({ ...prev, [listType]: { ...prev[listType], [index]: !prev[listType]?.[index], }, })); };
    const handleDeleteOrder = () => {
        setModalMessage(`Är du säker på att du vill radera Order ${orderNumber} och ALLA medföljande artiklar permanent? Detta kan inte ångras.`);
        // setIsDeleteError(false); // Not needed directly if using modalMode
        setModalMode('confirm'); // Set to confirmation mode
        setIsDeleteModalOpen(true);
        setError(null);
    };
    const deletePrilista = async (prilistaId) => { if (!window.confirm("Är du säker?")) return; try { await axios.delete(`${process.env.REACT_APP_API_URL}/api/prilista/${prilistaId}`, { headers: { Authorization: `Bearer ${token}` }, }); await fetchData(); } catch (err) { console.error('Failed to remove prilista:', err); setError(err.response?.data?.message || 'Kunde inte ta bort okantad artikel.'); }};
    const deleteKantlista = async (kantlistaId) => { if (!window.confirm("Är du säker?")) return; try { await axios.delete(`${process.env.REACT_APP_API_URL}/api/kantlista/${kantlistaId}`, { headers: { Authorization: `Bearer ${token}` }, }); await fetchData(); } catch (err) { console.error('Failed to remove kantlista:', err); setError(err.response?.data?.message || 'Kunde inte ta bort kantad artikel.'); }};
    // --- ADD DELETE HANDLER FOR KLUPPLISTA ---
    const deleteKlupplista = async (klupplistaId) => {
        if (!window.confirm("Är du säker?")) return;
        try {
            // Assumes DELETE /api/klupplista/:id exists
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/klupplista/${klupplistaId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            await fetchData(); // Re-fetch data after delete
        } catch (err) {
            console.error('Failed to remove klupplista:', err);
             setError(err.response?.data?.message || 'Kunde inte ta bort klupplista-artikel.');
        }
    };

    const confirmDeletion = async () => {
        setError(null);
        setIsDeleting(true);

        try {
            await axios.delete(
                `${process.env.REACT_APP_API_URL}/api/orders/${orderNumber}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setIsDeleting(false);
            setModalMessage(`Order ${orderNumber} har raderats.`);
            setModalMode('success'); // <-- SET TO SUCCESS MODE
            // Keep modal open to show success
            setTimeout(() => {
                setIsDeleteModalOpen(false);
                navigate('/dashboard/orders');
            }, 1500);

        } catch (err) {
            console.error('Failed to delete order:', err);
            const errorMsg = err.response?.data?.message || 'Kunde inte radera ordern.';
            setError(errorMsg); // Set main error state if desired
            setModalMessage(`Fel vid radering: ${errorMsg}`);
            setModalMode('error'); // <-- SET TO ERROR MODE
            setIsDeleting(false);
            // Keep modal open to show error
        }
    };

    const closeModal = () => {
        setIsDeleteModalOpen(false);
        setTimeout(() => {
            setModalMessage('');
            setModalMode('confirm'); // Reset mode when closing
        }, 300);
    };

    // --- Conditional Rendering Logic ---
    if (loading) { return <p className={styles.loading}>Laddar...</p>; }
    if (error) { return <p className={styles.error}>Fel: {error}</p>; }
    if (!orderDetails) { return <p className={styles.error}>Kunde inte ladda orderdetaljer.</p>; }

    // Prepare props to pass down
    const layoutProps = {
        orderDetails, prilistaDetails, kantListaDetails, klupplistaDetails, expandedItems, styles,
        handleChange, handlePrilistaChange, handleKantListaChange, handleKlupplistaChange, handleSubmit,
        toggleExpanded, handleDeleteOrder, deletePrilista, deleteKantlista, deleteKlupplista, error,
    };

    // Render the correct layout based on the ORDER design setting <-- UPDATE THIS CONDITION
    return (
        <div className={styles.editOrderFormContainer}>
                  
<Modal
               isOpen={isDeleteModalOpen}
               onRequestClose={closeModal}
               contentLabel="Order Radering" // More generic label
               ariaHideApp={false}
               className={styles.modalContent}
               overlayClassName={styles.modalOverlay}
            >
              {/* Title changes based on mode */}
              <h2 className={
                  modalMode === 'error' ? styles.modalErrorTitle :
                  modalMode === 'success' ? styles.modalSuccessTitle : // Add .modalSuccessTitle style
                  styles.modalConfirmTitle
                }>
                  {modalMode === 'error' && "Fel vid Radering"}
                  {modalMode === 'success' && "Order Raderad"}
                  {modalMode === 'confirm' && "Bekräfta Radering"}
              </h2>
              <p className={styles.modalMessage}>{modalMessage}</p>
              <div className={styles.modalActions}>
                {/* Show buttons based on modalMode */}
                {modalMode === 'confirm' && (
                    <>
                        <button onClick={confirmDeletion} className={styles.confirmButton} disabled={isDeleting}>
                            {isDeleting && <span className={styles.spinner}></span>}
                            {isDeleting ? 'Raderar...' : 'Ja, Radera Order'}
                        </button>
                        <button onClick={closeModal} className={styles.cancelButton} disabled={isDeleting}>
                            Avbryt
                        </button>
                    </>
                )}
                {(modalMode === 'success' || modalMode === 'error') && (
                    <button onClick={closeModal} className={styles.cancelButton}>
                        Stäng
                    </button>
                )}
              </div>
            </Modal>

    
            {orderDesignSetting === 'old' ? (
                <EditOrderFormOldLayout {...layoutProps} />
            ) : (
                <EditOrderFormNewLayout {...layoutProps} /> // Default to new layout
            )}
        </div>
    );
};

export default EditOrderForm;
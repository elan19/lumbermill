// src/components/Order/EditOrderFormOldLayout.js (adjust path as needed)
import React from 'react';
import { Link } from 'react-router-dom';

// Receive all necessary props from the parent
const EditOrderFormOldLayout = ({
    orderDetails,
    prilistaDetails,
    kantListaDetails,
    klupplistaDetails,
    expandedItems,
    styles,
    handleChange,
    handlePrilistaChange,
    handleKantListaChange,
    handleKlupplistaChange,
    handleSubmit,
    handleDeleteOrder,
    toggleExpanded,
    deletePrilista,
    deleteKantlista,
    deleteKlupplista,
    error
}) => {
    // --- PASTE THE JSX STRUCTURE of the OLD layout here ---
    // Make sure it uses the passed props correctly (e.g., styles.input, orderDetails.customer, handleChange etc.)
    // It will likely look more like the version in your original post before the fieldset changes.

    return (
        <div className={styles.editOrderForm}>
          <div className={styles.formHeaderActions}>
             <Link to="/dashboard/orders" className={styles.backButton}> {/* Link back to orders list */}
                ← Tillbaka till Ordrar {/* Use HTML arrow entity */}
             </Link>
             <button
                type="button"
                className={styles.deleteOrderButtonHeader} // Use a specific class for header button
                onClick={handleDeleteOrder}
                title="Radera hela ordern permanent" // Accessibility
            >
                Radera Order {/* Simplified text? */}
            </button>
          </div>
          <h2>Redigera Order</h2>
          {error && <p className={styles.errorFieldset}>Fel: {error}</p>}
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
                <label htmlFor="speditor">Speditör:</label>
                <input type="text" id="speditor" name="speditor" value={orderDetails.speditor || ''} onChange={handleChange} className={styles.input} placeholder="Speditörens namn/info"/>
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
                <button type="button" onClick={() => deletePrilista(prilistaItem._id)}
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
                  <select
                    id={`prilista-${index}-type`}
                    name="type"
                    value={prilistaItem.type || ''}
                    onChange={(e) => handlePrilistaChange(index, e)}
                    className={styles.input}
                  >
                    <option value="FURU">FURU</option>
                    <option value="GRAN">GRAN</option>
                  </select>
                  <label htmlFor={`prilista-${index}-pktNr`}>Paketnummer:</label>
                  <input
                    type="number"
                    id={`prilista-${index}-pktNr`}
                    name="pktNr"
                    value={prilistaItem.pktNr || ''}
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
                  <label htmlFor={`prilista-${index}-active`}>Aktiv:</label>
                  <select
                    id={`prilista-${index}-active`}
                    name="active"
                    value={prilistaItem.active !== undefined ? prilistaItem.active : ''}
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
                <button type="button" onClick={() => deleteKantlista(kantListaItem._id)}
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
                <label htmlFor={`kantlista-${index}-typ`}>Träslag:</label>
                <select
                  id={`kantlista-${index}-typ`}
                  name="typ"
                  value={kantListaItem.type || ''}
                  onChange={(e) => handleKantListaChange(index, e)}
                  className={styles.input}
                >
                  <option value="FURU">FURU</option>
                  <option value="GRAN">GRAN</option>
                </select>
                <label htmlFor={`kantlista-${index}-pktNr`}>Paketnummer:</label>
                <input
                  type="number"
                  id={`kantlista-${index}-pktNr`}
                  name="pktNr"
                  value={kantListaItem.pktNr || ''}
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

            {/* --- Klupplista Section (Old Layout) --- ADD THIS --- */}
            <h3>Klupplista</h3>
                {klupplistaDetails.length === 0 && <p>Inga klupplistor i denna order.</p>}
                {klupplistaDetails.map((kluppItem, index) => (
                    <div key={kluppItem._id || index} className={`${styles.prilistaItem} ${kluppItem.status?.klar ? styles.completed : ''}`}> {/* Use a consistent item class */}
                        <h3>Klupplista Artikel #{index + 1} {kluppItem.status?.klar && <span className={styles.completedBadge}>Klar</span>}</h3>
                        <div className={styles.detailAndRemoveBtnDiv}>
                            <button type="button" onClick={() => toggleExpanded('klupplista', index)} className={styles.toggleButton}>
                                {expandedItems.klupplista?.[index] ? 'Dölj detaljer' : 'Visa detaljer'}
                            </button>
                            <button type="button" onClick={() => deleteKlupplista(kluppItem._id)} className={styles.deleteButton}> X </button>
                        </div>

                        {expandedItems.klupplista?.[index] && (
                            <div className={styles.details}>
                                {/* Editable Input fields for Klupplista */}
                                <label htmlFor={`klupp-${index}-sagverk`}>Sågverk:</label>
                                <input id={`klupp-${index}-sagverk`} name="sagverk" value={kluppItem.sagverk || ''} onChange={(e) => handleKlupplistaChange(index, e)} className={styles.input}/>

                                <label htmlFor={`klupp-${index}-dimension`}>Dimension *:</label>
                                <input id={`klupp-${index}-dimension`} name="dimension" value={kluppItem.dimension || ''} onChange={(e) => handleKlupplistaChange(index, e)} required className={styles.input}/>

                                <label htmlFor={`klupp-${index}-max_langd`}>Längd *:</label>
                                <input id={`klupp-${index}-max_langd`} name="max_langd" value={kluppItem.max_langd || ''} onChange={(e) => handleKlupplistaChange(index, e)} required className={styles.input}/>

                                <label htmlFor={`klupp-${index}-pktNumber`}>Pkt Nummer:</label>
                                <input id={`klupp-${index}-pktNumber`} name="pktNumber" value={kluppItem.pktNumber || ''} onChange={(e) => handleKlupplistaChange(index, e)} className={styles.input}/>

                                <label htmlFor={`klupp-${index}-sort`}>Träslag:</label>
                                <select
                                  id={`klupp-${index}-sort`}
                                  name="sort"
                                  value={kluppItem.sort || ''}
                                  onChange={(e) => handleKlupplistaChange(index, e)}
                                  className={styles.input}
                                >
                                  <option value="FURU">FURU</option>
                                  <option value="GRAN">GRAN</option>
                                </select>

                                <label htmlFor={`klupp-${index}-stad`}>Märkning (Stad):</label>
                                <input id={`klupp-${index}-stad`} name="stad" value={kluppItem.stad || ''} onChange={(e) => handleKlupplistaChange(index, e)} className={styles.input}/>

                                {/* --- NEW STATUS UI FOR KLUPPLISTA --- */}
                                <div className={styles.statusSectionOld}> {/* Add a wrapper for status controls */}
                                    <div className={styles.statusCheckboxOld}>
                                        <label htmlFor={`klupp-${index}-status-klar`}>Klar:</label>
                                        <input
                                            type="checkbox"
                                            id={`klupp-${index}-status-klar`}
                                            name="status.klar"
                                            checked={!!kluppItem.status?.klar}
                                            onChange={(e) => handleKlupplistaChange(index, e)}
                                            disabled={kluppItem.status?.ej_Klar !== null && kluppItem.status?.ej_Klar !== undefined}
                                            className={styles.checkboxInput} // Optional specific class
                                        />
                                    </div>

                                    {!kluppItem.status?.klar && (
                                        <div className={styles.statusEjKlarOld}>
                                            <label htmlFor={`klupp-${index}-status-ej_Klar`}>Anledning Ej klar:</label>
                                            <select
                                                id={`klupp-${index}-status-ej_Klar`}
                                                name="status.ej_Klar"
                                                value={kluppItem.status?.ej_Klar || ''}
                                                onChange={(e) => handleKlupplistaChange(index, e)}
                                                disabled={!!kluppItem.status?.klar}
                                                className={styles.select} // Use existing select style
                                            >
                                                <option value="">Inget fel</option>
                                                <option value="1">Ej Hittad</option>
                                                <option value="2">Ingen Tid</option>
                                                <option value="3">Annat</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                                {/* --- END NEW STATUS UI --- */}

                                <label htmlFor={`klupp-${index}-information`}>Information:</label>
                                <input id={`klupp-${index}-information`} name="information" value={kluppItem.information || ''} onChange={(e) => handleKlupplistaChange(index, e)} className={styles.input}/>
                            </div>
                        )}
                    </div>
                ))}
                {/* --- END OF KLUPPLISTA SECTION --- */}

                <button type="submit" className={styles.submitButton}>Spara Ändringar</button>
            </form>
        </div>
      );
};

export default EditOrderFormOldLayout;
// src/components/Order/EditOrderFormNewLayout.js
import React from 'react';
import { Link } from 'react-router-dom';

// Receive all necessary props from the parent
const EditOrderFormNewLayout = ({
    orderDetails,
    prilistaDetails,
    kantListaDetails,
    klupplistaDetails, // Received klupplistaDetails
    expandedItems,
    styles,
    handleChange,
    handlePrilistaChange,
    handleKantListaChange,
    handleKlupplistaChange, // Received handler for klupplista
    handleSubmit,
    toggleExpanded,
    handleDeleteOrder,
    deletePrilista,
    deleteKantlista,
    deleteKlupplista, // Received delete handler for klupplista
    error
}) => {
    return (
        // Root div using fieldset style (assuming this is intended for the "new" layout)
        <div className={styles.editOrderFormFieldset}>
            {/* Header with Back and Delete buttons */}
            <div className={styles.formHeaderActions}>
                <Link to="/dashboard/orders" className={styles.backButton}>
                    ← Tillbaka till Ordrar
                </Link>
                <button
                    type="button"
                    className={styles.deleteOrderButtonHeader}
                    onClick={handleDeleteOrder}
                    title="Radera hela ordern permanent"
                >
                    Radera Order
                </button>
            </div>
            <h2>Redigera Order #{orderDetails.orderNumber}</h2>
            {error && <p className={styles.errorFieldset}>Fel: {error}</p>}

            <form className={styles.formFieldset} onSubmit={handleSubmit}>
                {/* Orderinformation Fieldset */}
                <fieldset className={styles.formSectionFieldset}>
                    <legend>Orderinformation</legend>
                    <div className={styles.formGroupFieldset}><label htmlFor="orderNumber">Ordernummer:</label><input type="number" id="orderNumber" name="orderNumber" value={orderDetails.orderNumber || ''} onChange={handleChange} required className={styles.input}/></div>
                    <div className={styles.formGroupFieldset}><label htmlFor="customer">Köpare:</label><input type="text" id="customer" name="customer" value={orderDetails.customer || ''} onChange={handleChange} required className={styles.input}/></div>
                    <div className={styles.formGroupFieldset}><label htmlFor="delivery">Avrop:</label><input type="text" id="delivery" name="delivery" value={orderDetails.delivery || ''} onChange={handleChange} className={styles.input}/></div>
                    <div className={styles.formGroupFieldset}><label htmlFor="speditor">Speditör:</label><input type="text" id="speditor" name="speditor" value={orderDetails.speditor || ''} onChange={handleChange} className={styles.input} placeholder="Speditörens namn/info"/></div>
                    <div className={styles.formGroupFieldset}><label htmlFor="status">Status:</label><select id="status" name="status" value={orderDetails.status || 'In Progress'} onChange={handleChange} required className={styles.select}><option value="In Progress">Pågående</option><option value="Completed">Avklarad</option><option value="Delivered">Levererad</option></select></div>
                    <div className={styles.formGroupFieldset}><label htmlFor="notes">Anteckningar:</label><textarea id="notes" name="notes" value={orderDetails.notes || ''} onChange={handleChange} className={styles.textarea} rows="4"/></div>
                </fieldset>

                {/* Prilista Section */}
                <fieldset className={styles.formSectionFieldset}>
                    <legend>Okantad</legend>
                    {prilistaDetails.length === 0 && <p className={styles.emptyListNoteFieldset}>Inga okantade artiklar.</p>}
                    {prilistaDetails.map((prilistaItem, index) => (
                        <div key={prilistaItem._id || index} className={`${styles.listItemFieldset} ${prilistaItem.completed ? styles.completedFieldset : ''}`}>
                            <div className={styles.itemHeaderFieldset}>
                                <h4>Okantad Artikel #{index + 1} {prilistaItem.completed && <span className={styles.completedBadgeFieldset}>✓</span>}</h4>
                                <div className={styles.itemActionsFieldset}>
                                    <button type="button" onClick={() => toggleExpanded('prilista', index)} className={styles.toggleButton} aria-expanded={!!expandedItems.prilista?.[index]}>
                                        {expandedItems.prilista?.[index] ? 'Dölj' : 'Redigera'}
                                    </button>
                                    <button type="button" onClick={() => deletePrilista(prilistaItem._id)} className={styles.deleteButton} title="Ta bort artikel">×</button>
                                </div>
                            </div>
                            {expandedItems.prilista?.[index] && (
                                <div className={styles.detailsGridFieldset}>
                                    {/* Prilista Inputs */}
                                    <div className={styles.inputGroupFieldset}><label htmlFor={`p-qty-${index}`}>Antal:</label><input type="number" id={`p-qty-${index}`} name="quantity" value={prilistaItem.quantity || ''} onChange={(e) => handlePrilistaChange(index, e)} className={styles.input}/></div>
                                    <div className={styles.inputGroupFieldset}><label htmlFor={`p-dim-${index}`}>Dimension:</label><input type="text" id={`p-dim-${index}`} name="dimension" value={prilistaItem.dimension || ''} onChange={(e) => handlePrilistaChange(index, e)} className={styles.input}/></div>
                                    <div className={styles.inputGroupFieldset}><label htmlFor={`p-size-${index}`}>Storlek:</label><input type="text" id={`p-size-${index}`} name="size" value={prilistaItem.size || ''} onChange={(e) => handlePrilistaChange(index, e)} className={styles.input}/></div>
                                    <div className={styles.inputGroupFieldset}>
                                    <label htmlFor={`p-type-${index}`}>Träslag:</label>
                                    <select
                                        id={`p-type-${index}`}
                                        name="type"
                                        value={prilistaItem.type || ''}
                                        onChange={(e) => handlePrilistaChange(index, e)}
                                        className={styles.input}
                                    >
                                        <option value="FURU">FURU</option>
                                        <option value="GRAN">GRAN</option>
                                    </select>
                                    </div>
                                    <div className={styles.inputGroupFieldset}><label htmlFor={`p-pktNr-${index}`}>Paketnummer:</label><input type="text" id={`p-pktNr-${index}`} name="pktNr" value={prilistaItem.pktNr || ''} onChange={(e) => handlePrilistaChange(index, e)} className={styles.input}/></div>
                                    <div className={styles.inputGroupFieldset}><label htmlFor={`p-loc-${index}`}>Lagerplats:</label><input type="text" id={`p-loc-${index}`} name="location" value={prilistaItem.location || ''} onChange={(e) => handlePrilistaChange(index, e)} className={styles.input}/></div>
                                    <div className={styles.inputGroupFieldset}><label htmlFor={`p-active-${index}`}>Aktiv:</label><select id={`p-active-${index}`} name="active" value={prilistaItem.active ? 'true' : 'false'} onChange={(e) => handlePrilistaChange(index, e)} className={styles.select}><option value="true">Ja</option><option value="false">Nej</option></select></div>
                                    <div className={styles.inputGroupFieldset}><label htmlFor={`p-comp-${index}`}>Avklarad:</label><select id={`p-comp-${index}`} name="completed" value={prilistaItem.completed ? 'true' : 'false'} onChange={(e) => handlePrilistaChange(index, e)} className={styles.select}><option value="true">Ja</option><option value="false">Nej</option></select></div>
                                    <div className={`${styles.inputGroupFieldset} ${styles.fullWidthFieldset}`}><label htmlFor={`p-desc-${index}`}>Information:</label><input type="text" id={`p-desc-${index}`} name="description" value={prilistaItem.description || ''} onChange={(e) => handlePrilistaChange(index, e)} className={styles.input}/></div>
                                </div>
                            )}
                        </div>
                    ))}
                </fieldset>

                 {/* Kantlista Section */}
                <fieldset className={styles.formSectionFieldset}>
                   <legend>Kantad</legend>
                   {kantListaDetails.length === 0 && <p className={styles.emptyListNoteFieldset}>Inga kantade artiklar.</p>}
                   {kantListaDetails.map((kantListaItem, index) => (
                        <div key={kantListaItem._id || index} className={`${styles.listItemFieldset} ${kantListaItem.status?.klar && kantListaItem.status?.kapad ? styles.completedFieldset : ''}`}>
                             <div className={styles.itemHeaderFieldset}>
                                <h4>Kantad Artikel #{index + 1} {kantListaItem.status?.klar && kantListaItem.status?.kapad && <span className={styles.completedBadgeFieldset}>✓</span>}</h4>
                                <div className={styles.itemActionsFieldset}>
                                    <button type="button" onClick={() => toggleExpanded('kantlista', index)} className={styles.toggleButton} aria-expanded={!!expandedItems.kantlista?.[index]}>
                                        {expandedItems.kantlista?.[index] ? 'Dölj' : 'Redigera'}
                                    </button>
                                    <button type="button" onClick={() => deleteKantlista(kantListaItem._id)} className={styles.deleteButton} title="Ta bort artikel">×</button>
                                </div>
                             </div>
                            {expandedItems.kantlista?.[index] && (
                                <div className={styles.detailsGridFieldset}>
                                    {/* Kantlista Inputs */}
                                    <div className={styles.inputGroupFieldset}><label htmlFor={`k-antal-${index}`}>Antal:</label><input type="number" id={`k-antal-${index}`} name="antal" value={kantListaItem.antal || ''} onChange={(e) => handleKantListaChange(index, e)} className={styles.input}/></div>
                                    <div className={styles.inputGroupFieldset}><label htmlFor={`k-tjock-${index}`}>Tjocklek:</label><input type="text" id={`k-tjock-${index}`} name="tjocklek" value={kantListaItem.tjocklek || ''} onChange={(e) => handleKantListaChange(index, e)} className={styles.input}/></div>
                                    <div className={styles.inputGroupFieldset}><label htmlFor={`k-bredd-${index}`}>Bredd:</label><input type="text" id={`k-bredd-${index}`} name="bredd" value={kantListaItem.bredd || ''} onChange={(e) => handleKantListaChange(index, e)} className={styles.input}/></div>
                                    <div className={styles.inputGroupFieldset}><label htmlFor={`k-varv-${index}`}>Varv:</label><input type="text" id={`k-varv-${index}`} name="varv" value={kantListaItem.varv || ''} onChange={(e) => handleKantListaChange(index, e)} className={styles.input}/></div>
                                    <div className={styles.inputGroupFieldset}><label htmlFor={`k-maxl-${index}`}>Max längd:</label><input type="text" id={`k-maxl-${index}`} name="max_langd" value={kantListaItem.max_langd || ''} onChange={(e) => handleKantListaChange(index, e)} className={styles.input}/></div>
                                    <div className={styles.inputGroupFieldset}><label htmlFor={`k-pktNr-${index}`}>Paketnummer:</label><input type="text" id={`k-pktNr-${index}`} name="pktNr" value={kantListaItem.pktNr || ''} onChange={(e) => handleKantListaChange(index, e)} className={styles.input}/></div>
                                    <div className={styles.inputGroupFieldset}>
                                    <label htmlFor={`k-typ-${index}`}>Träslag:</label>
                                    <select
                                        id={`k-typ-${index}`}
                                        name="typ"
                                        value={kantListaItem.typ || ''}
                                        onChange={(e) => handleKantListaChange(index, e)}
                                        className={styles.input}
                                    >
                                        <option value="FURU">FURU</option>
                                        <option value="GRAN">GRAN</option>
                                    </select>
                                    </div>
                                    <div className={styles.inputGroupFieldset}><label htmlFor={`k-stampel-${index}`}>Stämpel:</label><input type="text" id={`k-stampel-${index}`} name="stampel" value={kantListaItem.stampel || ''} onChange={(e) => handleKantListaChange(index, e)} className={styles.input}/></div>
                                    <div className={styles.inputGroupFieldset}><label htmlFor={`k-lager-${index}`}>Lagerplats:</label><input type="text" id={`k-lager-${index}`} name="lagerplats" value={kantListaItem.lagerplats || ''} onChange={(e) => handleKantListaChange(index, e)} className={styles.input}/></div>
                                    <div className={`${styles.inputGroupFieldset} ${styles.fullWidthFieldset}`}><label htmlFor={`k-info-${index}`}>Information:</label><input type="text" id={`k-info-${index}`} name="information" value={kantListaItem.information || ''} onChange={(e) => handleKantListaChange(index, e)} className={styles.input}/></div>
                                    <div className={styles.inputGroupFieldset}><label htmlFor={`k-kapad-${index}`}>Kapad:</label><select id={`k-kapad-${index}`} name="status.kapad" value={kantListaItem.status?.kapad ? "true" : "false"} onChange={(e) => handleKantListaChange(index, e)} className={styles.select}><option value="true">Ja</option><option value="false">Nej</option></select></div>
                                    <div className={styles.inputGroupFieldset}><label htmlFor={`k-klar-${index}`}>Klar:</label><select id={`k-klar-${index}`} name="status.klar" value={kantListaItem.status?.klar ? "true" : "false"} onChange={(e) => handleKantListaChange(index, e)} className={styles.select}><option value="true">Ja</option><option value="false">Nej</option></select></div>
                                </div>
                            )}
                        </div>
                   ))}
                </fieldset>

                {/* --- Klupplista Section --- */}
                <fieldset className={styles.formSectionFieldset}>
                   <legend>Klupplista</legend>
                   {klupplistaDetails.length === 0 && <p className={styles.emptyListNoteFieldset}>Inga klupplistor i denna order.</p>}
                   {klupplistaDetails.map((kluppItem, index) => (
                        <div key={kluppItem._id || index} className={`${styles.listItemFieldset} ${kluppItem.status?.klar ? styles.completedFieldset : ''}`}>
                             <div className={styles.itemHeaderFieldset}>
                                <h4>Klupplista Artikel #{index + 1} {kluppItem.status?.klar && <span className={styles.completedBadgeFieldset}>✓ Klar</span>}</h4>
                                <div className={styles.itemActionsFieldset}>
                                    <button type="button" onClick={() => toggleExpanded('klupplista', index)} className={styles.toggleButton} aria-expanded={!!(expandedItems.klupplista && expandedItems.klupplista[index])}>
                                        {expandedItems.klupplista?.[index] ? 'Dölj' : 'Redigera'}
                                    </button>
                                    <button type="button" onClick={() => deleteKlupplista(kluppItem._id)} className={styles.deleteButton} title="Ta bort artikel">
                                        ×
                                    </button>
                                </div>
                             </div>
                            {expandedItems.klupplista?.[index] && (
                                <div className={styles.detailsGridFieldset}>
                                     {/* Editable Input fields for Klupplista */}
                                    <div className={styles.inputGroupFieldset}>
                                        <label htmlFor={`klupp-sagverk-${index}`}>Sågverk:</label>
                                        <input type="text" id={`klupp-sagverk-${index}`} name="sagverk" value={kluppItem.sagverk || ''} onChange={(e) => handleKlupplistaChange(index, e)} className={styles.input}/>
                                    </div>
                                    <div className={styles.inputGroupFieldset}>
                                        <label htmlFor={`klupp-dim-${index}`}>Dimension *:</label>
                                        <input type="text" id={`klupp-dim-${index}`} name="dimension" value={kluppItem.dimension || ''} onChange={(e) => handleKlupplistaChange(index, e)} required className={styles.input}/>
                                    </div>
                                     <div className={styles.inputGroupFieldset}>
                                        <label htmlFor={`klupp-maxl-${index}`}>Längd *:</label>
                                        <input type="text" id={`klupp-maxl-${index}`} name="max_langd" value={kluppItem.max_langd || ''} onChange={(e) => handleKlupplistaChange(index, e)} required className={styles.input}/>
                                    </div>
                                     <div className={styles.inputGroupFieldset}>
                                        <label htmlFor={`klupp-pkt-${index}`}>Pkt Nummer:</label>
                                        <input type="text" id={`klupp-pkt-${index}`} name="pktNumber" value={kluppItem.pktNumber || ''} onChange={(e) => handleKlupplistaChange(index, e)} className={styles.input}/>
                                    </div>
                                    <div className={styles.inputGroupFieldset}>
                                    <label htmlFor={`klupp-sort-${index}`}>Träslag:</label>
                                    <select
                                        id={`klupp-sort-${index}`}
                                        name="sort"
                                        value={kluppItem.typ || ''}
                                        onChange={(e) => handleKantListaChange(index, e)}
                                        className={styles.input}
                                    >
                                        <option value="FURU">FURU</option>
                                        <option value="GRAN">GRAN</option>
                                    </select>
                                    </div>
                                    <div className={styles.inputGroupFieldset}>
                                        <label htmlFor={`klupp-stad-${index}`}>Märkning (Stad):</label>
                                        <input type="text" id={`klupp-stad-${index}`} name="stad" value={kluppItem.stad || ''} onChange={(e) => handleKlupplistaChange(index, e)} className={styles.input}/>
                                    </div>
                                    {/* Excluded Magasin, Lagerplats, LeveransDatum as requested earlier */}
                                    <div className={styles.inputGroupFieldset}>
                                        <label htmlFor={`klupp-klar-${index}`}>Klar:</label>
                                        <select id={`klupp-klar-${index}`} name="status.klar" value={kluppItem.status?.klar ? 'true' : 'false'} onChange={(e) => handleKlupplistaChange(index, e)} className={styles.select}>
                                            <option value="true">Ja</option>
                                            <option value="false">Nej</option>
                                        </select>
                                    </div>
                                     <div className={styles.inputGroupFieldset}>
                                        <label htmlFor={`klupp-ejklar-${index}`}>Anledning Ej klar:</label> {/* Renamed from "Ej Klar" */}
                                         <select
                                            id={`klupp-ejklar-${index}`}
                                            name="status.ej_Klar" // Correct name from schema
                                            value={kluppItem.status?.ej_Klar || ''} // Bind to ej_Klar (use empty string for no selection)
                                            onChange={(e) => handleKlupplistaChange(index, e)}
                                            className={styles.select}
                                            disabled={!!kluppItem.status?.klar} // Disable if "Klar" is checked
                                        >
                                            <option value="">Inget fel</option>
                                            <option value="1">Ej Hittad</option>
                                            <option value="2">Ingen Tid</option>
                                            <option value="3">Annat</option>
                                        </select>
                                     </div>
                                     <div className={`${styles.inputGroupFieldset} ${styles.fullWidthFieldset}`}>
                                        <label htmlFor={`klupp-info-${index}`}>Information:</label>
                                        <input type="text" id={`klupp-info-${index}`} name="information" value={kluppItem.information || ''} onChange={(e) => handleKlupplistaChange(index, e)} className={styles.input}/>
                                    </div>
                                </div>
                            )}
                        </div>
                   ))}
                </fieldset>
                {/* --- END OF KLUPPLISTA SECTION --- */}

                {/* Form Actions */}
                <div className={styles.formActions}>
                    <button type="submit" className={styles.submitButtonFieldset}>
                        Spara Ändringar
                    </button>
                    {/* Delete button is in the header now */}
                </div>
            </form>
        </div>
    );
};

export default EditOrderFormNewLayout;
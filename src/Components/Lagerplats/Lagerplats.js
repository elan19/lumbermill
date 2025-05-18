import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './Lagerplats.module.css';

import { useAuth } from '../../contexts/AuthContext';

const LagerPlatsComp = () => {
  const [lagerplatser, setLagerplatser] = useState([]);
  const [formData, setFormData] = useState({
    type: "Sågat", // Default type
    tree: "",
    dim: "",
    location: "",
    sawData: { tum: "", typ: "", nt: "" },
    kantatData: { bredd: "", varv: "", max_langd: "", kvalite: "", pktNr: "" },
    okantatData: { varv: "", kvalite: "", typ: "", nt: "", pktNr: "", pktNamn: "" },
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const token = localStorage.getItem('token');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [editing, setEditing] = useState(null); 
  const [editedValue, setEditedValue] = useState('');
  const [lastClick, setLastClick] = useState(0);
  const [lastTouch, setLastTouch] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const { hasPermission } = useAuth();

  useEffect(() => {
    fetchLagerplatser();
  }, []);

  const fetchLagerplatser = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/lagerplats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLagerplatser(response.data);
    } catch (err) {
      console.error('Failed to fetch lagerplatser:', err);
    }
  };

  const handleDoubleClick = (rowIndex, columnKey, currentValue, isTouchEvent) => {
    const currentTime = Date.now();
    const activateEditing = () => {
        setEditing({ rowIndex, columnKey });
        setEditedValue(currentValue === undefined || currentValue === null ? "" : String(currentValue));
    };

    if (!isTouchEvent && currentTime - lastClick < 300) {
        activateEditing();
    } else if (isTouchEvent && currentTime - lastTouch < 300) {
        activateEditing();
    }
  
    setLastClick(currentTime);
    setLastTouch(currentTime);
  };
  
  const handleSave = async (rowIndex, columnKey) => {
    const paginatedCurrentItems = filteredLagerplatser.slice(indexOfFirstItem, indexOfLastItem);
    const editedItem = paginatedCurrentItems[rowIndex];

    if (!editedItem) {
        console.error("Edited item not found in paginated list.");
        setEditing(null);
        return;
    }

    const lagerplatserCopy = [...lagerplatser];
    const originalIndex = lagerplatserCopy.findIndex(item => item._id === editedItem._id);

    if (originalIndex === -1) {
      console.error("Kunde inte hitta objektet i ofiltrerad lista.");
      setEditing(null);
      return;
    }

    const keys = columnKey.split('.');
    const lastKey = keys.pop();
    let currentObj = lagerplatserCopy[originalIndex];

    keys.forEach((key) => {
      if (!currentObj[key] || typeof currentObj[key] !== 'object') {
        currentObj[key] = {}; 
      }
      currentObj = currentObj[key];
    });
    
    let valueToSave = editedValue;
    // Example: Convert to number for specific fields defined as Number in schema
    if ((columnKey === 'dim' || columnKey === 'sawData.tum' /* add other numeric fields like kantatData.bredd if they are numbers */) 
        && valueToSave !== "" && !isNaN(Number(valueToSave))) {
        valueToSave = Number(editedValue);
    } else if ( (columnKey.endsWith('.varv') || columnKey.endsWith('.max_langd') || columnKey.endsWith('.tum')) && valueToSave !== "" && !isNaN(Number(valueToSave))) {
        // Assuming varv, max_langd, tum can be numbers
        // Check your schema for actual types
        valueToSave = Number(editedValue);
    }


    currentObj[lastKey] = valueToSave;
    const updatedField = { [columnKey]: valueToSave };

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/lagerplats/${lagerplatserCopy[originalIndex]._id}`,
        updatedField,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLagerplatser(lagerplatserCopy);
      setEditing(null); 
    } catch (err) {
      console.error("Failed to save updated data:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "type") {
      setFormData(prev => ({
        ...prev, // Keep all common fields
        type: value,
        // Reset only type-specific data, not common fields
        sawData: { tum: "", typ: "", nt: "" },
        kantatData: { bredd: "", varv: "", max_langd: "", kvalite: "", pktNr: "" },
        okantatData: { varv: "", kvalite: "", typ: "", nt: "", pktNr: "", pktNamn: "" },
      }));
      return;
    }

    if (name.startsWith("sawData.") || name.startsWith("kantatData.") || name.startsWith("okantatData.")) {
      const [parent, child] = name.split(".");
      setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/lagerplats`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchLagerplatser();
      setFormData({ 
        type: formData.type, // Retain current type for next entry
        tree: '', dim: '', location: '', 
        sawData: { tum: "", typ: "", nt: "" },
        kantatData: { bredd: "", varv: "", max_langd: "", kvalite: "", pktNr: "" },
        okantatData: { varv: "", kvalite: "", typ: "", nt: "", pktNr: "", pktNamn: "" },
      });
    } catch (err) {
      console.error('Failed to add lagerplats:', err);
    }
  };

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    } else if (sortConfig.key === key && sortConfig.direction === "descending") {
      setSortConfig({ key: null, direction: 'ascending' }); 
      fetchLagerplatser(); // Reset to original order
      return;
    }
    setSortConfig({ key, direction });
  
    const sortedData = [...lagerplatser].sort((a, b) => {
      const getValue = (obj, path) => {
        // Handle shared paths for sorting
        if (path === "sharedVarv") {
            if (obj.type === "Kantat") return obj.kantatData?.varv;
            if (obj.type === "Okantat") return obj.okantatData?.varv;
            return null;
        }
        if (path === "sharedKvalite") {
            if (obj.type === "Kantat") return obj.kantatData?.kvalite;
            if (obj.type === "Okantat") return obj.okantatData?.kvalite;
            return null;
        }
        if (path === "sharedTyp") { // "Sid/X"
            if (obj.type === "Sågat") return obj.sawData?.typ;
            if (obj.type === "Okantat") return obj.okantatData?.typ;
            return null;
        }
        if (path === "sharedNt") { // "Nertork"
            if (obj.type === "Sågat") return obj.sawData?.nt;
            if (obj.type === "Okantat") return obj.okantatData?.nt;
            return null;
        }
        if (path === "sharedPktNr") {
            if (obj.type === "Kantat") return obj.kantatData?.pktNr;
            if (obj.type === "Okantat") return obj.okantatData?.pktNr;
            return null;
        }
        if (path === "pktNamn") {  // Add pktNamn handling
          if (obj.type === "Okantat") return obj.okantatData?.pktNamn;
          return null;
        }
        // Fallback for non-shared keys or direct properties
        return path.split(".").reduce((o, p) => (o && o[p] !== undefined && o[p] !== null ? o[p] : null), obj);
      };

      let aValue = getValue(a, key);
      let bValue = getValue(b, key);

      // Numeric sort for specific keys (adjust as per your schema's data types)
      const numericKeys = ["dim", "sawData.tum", "kantatData.bredd", "kantatData.max_langd"]; 
      // For shared keys that might be numeric:
      if ( (key === "sharedVarv" || key === "sawData.tum" || key === "sharedPktNr") ) { 
          aValue = aValue !== null ? Number(aValue) : -Infinity;
          bValue = bValue !== null ? Number(bValue) : -Infinity;
      } else if (numericKeys.includes(key)){
          aValue = aValue !== null ? Number(aValue) : -Infinity;
          bValue = bValue !== null ? Number(bValue) : -Infinity;
      } else { // String sort for others
          aValue = aValue !== null ? String(aValue).toLowerCase() : "";
          bValue = bValue !== null ? String(bValue).toLowerCase() : "";
      }

      if (key.endsWith(".nt") || key === "sharedNt") { // Special sort for NT fields
          if (aValue === bValue) return 0;
          if (aValue === "-" || aValue === "") return direction === "ascending" ? -1 : 1;
          if (bValue === "-" || bValue === "") return direction === "ascending" ? 1 : -1;
      }

      if (aValue < bValue) return direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return direction === "ascending" ? 1 : -1;
      return 0;
    });
    setLagerplatser(sortedData);
  };
  
  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'ascending') return '▲';
      if (sortConfig.direction === 'descending') return '▼';
    }
    return '⬍';
  };

  const openHelpModal = () => setIsHelpModalOpen(true);
  const closeHelpModal = () => setIsHelpModalOpen(false);

  const deleteLagerPlats = async (lagerPlatsId) => {
    if (window.confirm("Är du säker på att du vill ta bort denna lagerplats?")) {
        try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/lagerplats/${lagerPlatsId}`,{
            headers: { Authorization: `Bearer ${token}` },
        });
        fetchLagerplatser();
        } catch (err) {
        console.error('Failed to remove lagerplats:', err);
        }
    }
  }

  const filteredLagerplatser = selectedCategory
    ? lagerplatser.filter((item) => item.type === selectedCategory)
    : lagerplatser;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLagerplatser.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, itemsPerPage]);

  // Helper function to render shared cells
  const renderSharedCell = (lagerplats, rowIndex, displayLogic) => {
    const { value, columnKeyForEdit, isNumeric } = displayLogic(lagerplats);
    
    return editing?.rowIndex === rowIndex && editing?.columnKey === columnKeyForEdit && columnKeyForEdit ? (
      <input
        type={isNumeric ? "number" : "text"}
        value={editedValue}
        onChange={(e) => setEditedValue(e.target.value)}
        onBlur={() => handleSave(rowIndex, columnKeyForEdit)}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSave(rowIndex, columnKeyForEdit))}
        autoFocus
      />
    ) : (
      <span onClick={(e) => columnKeyForEdit && handleDoubleClick(rowIndex, columnKeyForEdit, value, e.type === 'touchstart')}>
        {value !== null && value !== undefined ? value : "-"}
      </span>
    );
  };


  return (
    <div className={styles.lagerplatsContainer}>
      <h1>Lagerplats</h1>

      {/* --- HELP BUTTON (can be placed near the form or table filters) --- */}
      <div className={styles.headerActions}> {/* Optional wrapper for actions */}
        <button onClick={openHelpModal} className={styles.helpButtonLager}>
            Hjälp / Info
        </button>
        {/* You can add other header actions here if needed */}
      </div>
      {/* --- END HELP BUTTON --- */}

      <form onSubmit={handleSubmit} className={styles.formLayout}>
        {/* ... form inputs ... (no changes needed here from previous version) */}
        <select name="type" value={formData.type} onChange={handleInputChange}>
          <option value="Sågat">Sågat</option>
          <option value="Kantat">Kantat</option>
          <option value="Okantat">Okantat</option>
        </select>

        <label>Träslag: *</label>
        <input name="tree" value={formData.tree} onChange={handleInputChange} placeholder="Ex. f, gr" required />

        <label>Tjocklek: *</label>
        <input type="number" name="dim" value={formData.dim} onChange={handleInputChange} placeholder="Ex. 26, 63" required />

        <label>Lagerplats:</label>
        <input name="location" value={formData.location} onChange={handleInputChange} placeholder="Ex. jb 3h" />

        {formData.type === "Sågat" && (
          <>
            <label>Tum:</label>
            <input type="number" name="sawData.tum" value={formData.sawData.tum} placeholder="Ex. 11, 15" onChange={handleInputChange} />
            <label>Typ:</label>
            <input name="sawData.typ" value={formData.sawData.typ} placeholder="Ex: Sid/2x" onChange={handleInputChange} />
            <label>Nertork:</label>
            <input name="sawData.nt" value={formData.sawData.nt} placeholder="Ex: 12%" onChange={handleInputChange} />
          </>
        )}
        {formData.type === "Kantat" && (
          <>
            <label>Bredd: *</label>
            <input type="number" name="kantatData.bredd" value={formData.kantatData.bredd} placeholder="Ex. 75, 125" onChange={handleInputChange} />
            <label>Varv:</label>
            <input name="kantatData.varv" value={formData.kantatData.varv} placeholder="Ex. 15" onChange={handleInputChange} />
            <label>Max Längd:</label>
            <input name="kantatData.max_langd" value={formData.kantatData.max_langd} placeholder="Ex. 4.3" onChange={handleInputChange} />
            <label>Kvalite: *</label>
            <input name="kantatData.kvalite" value={formData.kantatData.kvalite} placeholder="Ex. A, B" onChange={handleInputChange} />
            {/* --- ADD PKTNR FOR KANTAT --- */}
            <label>Pkt Nr:</label>
            <input type="number" name="kantatData.pktNr" value={formData.kantatData.pktNr} placeholder="Paketnummer" onChange={handleInputChange} />
            {/* ---------------------------- */}
          </>
        )}
        {formData.type === "Okantat" && (
          <>
            <label>Varv:</label>
            <input name="okantatData.varv" value={formData.okantatData.varv} placeholder="Ex. 15" onChange={handleInputChange} />
            <label>Kvalite: *</label>
            <input name="okantatData.kvalite" value={formData.okantatData.kvalite} placeholder="Ex. A/UL/Modell/Blå" onChange={handleInputChange} />
            <label>Typ:</label>
            <input name="okantatData.typ" value={formData.okantatData.typ} placeholder="Sid/2X" onChange={handleInputChange} />
            <label>Nertork:</label>
            <input name="okantatData.nt" value={formData.okantatData.nt} placeholder="Ex. 16%" onChange={handleInputChange} />
            <label>Pkt Nr:</label>
            <input type="number" name="okantatData.pktNr" value={formData.okantatData.pktNr} placeholder="Paketnummer" onChange={handleInputChange} />
            <label>Pkt Namn:</label>
            <input name="okantatData.pktNamn" value={formData.okantatData.pktNamn} placeholder="Paketnamn" onChange={handleInputChange} />
          </>
        )}
        <button type="submit">Lägg till</button>
      </form>

      <div className={styles.tableDeciderDiv}>
        <button className={selectedCategory === 'Sågat' ? styles.activeButton : ''} onClick={() => setSelectedCategory('Sågat')}>Sågat</button>
        <button className={selectedCategory === 'Kantat' ? styles.activeButton : ''} onClick={() => setSelectedCategory('Kantat')}>Kantat</button>
        <button className={selectedCategory === 'Okantat' ? styles.activeButton : ''} onClick={() => setSelectedCategory('Okantat')}>Okantat</button>
        <button className={selectedCategory === null ? styles.activeButton : ''} onClick={() => setSelectedCategory(null)}>Visa alla</button>
        <select 
            className={styles.itemsPerPage}
            value={itemsPerPage} 
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value={lagerplatser.length > 0 ? lagerplatser.length : 100}>Alla</option>
          </select>
        </div>

      <div className={styles.tableContainer}>
        <table>
          <thead>
            <tr>
              {/* Always Visible */}
              <th onClick={() => handleSort("type")} title="Kategori"><span>Kategori</span> {getSortIndicator("type")}</th>
              <th onClick={() => handleSort("tree")} title="Träslag"><span>Träslag</span> {getSortIndicator("tree")}</th>
              <th onClick={() => handleSort("dim")} title="Tjocklek"><span>Tjocklek</span> {getSortIndicator("dim")}</th>

              {/* Kantat Specific */}
              {(selectedCategory === "Kantat" || selectedCategory === null) && (
                <th onClick={() => handleSort("kantatData.bredd")} title="Bredd (Kantat)"><span>Bredd</span> {getSortIndicator("kantatData.bredd")}</th>
              )}
              {(selectedCategory === "Kantat" || selectedCategory === null) && (
                <th onClick={() => handleSort("kantatData.max_langd")} title="Max Längd (Kantat)"><span>Max Längd</span> {getSortIndicator("kantatData.max_langd")}</th>
              )}

              {/* Sågat Specific */}
              {(selectedCategory === "Sågat" || selectedCategory === null) && (
                <th onClick={() => handleSort("sawData.tum")} title="Tum (Sågat)"><span>Tum</span> {getSortIndicator("sawData.tum")}</th>
              )}
              
              {/* Shared: Varv (Kantat, Okantat) */}
              {(selectedCategory === "Kantat" || selectedCategory === "Okantat" || selectedCategory === null) && (
                <th onClick={() => handleSort("sharedVarv")} title="Varv"><span>Varv</span> {getSortIndicator("sharedVarv")}</th>
              )}

              {/* Shared: Kvalite (Kantat, Okantat) */}
              {(selectedCategory === "Kantat" || selectedCategory === "Okantat" || selectedCategory === null) && (
                <th onClick={() => handleSort("sharedKvalite")} title="Kvalite"><span>Kvalite</span> {getSortIndicator("sharedKvalite")}</th>
              )}

              {/* Shared: Sid/X (Sågat, Okantat) */}
              {(selectedCategory === "Sågat" || selectedCategory === "Okantat" || selectedCategory === null) && (
                <th onClick={() => handleSort("sharedTyp")} title="Sid/X"><span>Typ</span> {getSortIndicator("sharedTyp")}</th>
              )}

              {/* Shared: Nertork (Sågat, Okantat) */}
              {(selectedCategory === "Sågat" || selectedCategory === "Okantat" || selectedCategory === null) && (
                <th onClick={() => handleSort("sharedNt")} title="Nertork"><span>NT</span> {getSortIndicator("sharedNt")}</th>
              )}

              {/* --- ADD PKTNR HEADER (SHARED IF APPLICABLE) --- */}
              {(selectedCategory === "Kantat" || selectedCategory === "Okantat" || selectedCategory === null) && (
                <th onClick={() => handleSort("sharedPktNr")} title="Pkt Nr"><span>Pkt Nr</span> {getSortIndicator("sharedPktNr")}</th>
              )}

              {(selectedCategory === "Okantat" || selectedCategory === null) && (
                <th onClick={() => handleSort("okantatData.paketNamn")} title="Pkt Namn"><span>Pkt Namn</span> {getSortIndicator("okantatData.pktNamn")}</th>
              )}

              {/* Always Visible */}
              <th onClick={() => handleSort("location")} title="Plats"><span>Plats</span> {getSortIndicator("location")}</th>
              {hasPermission('lagerplats', 'delete') && (
              <th>Ta bort</th>
              )}
            </tr>
          </thead>
          <tbody>
            {currentItems.map((lagerplats, rowIndex) => (
              <tr key={lagerplats._id}>
                {/* Kategori */}
                <td data-label="Kategori">{renderSharedCell(lagerplats, rowIndex, (lp) => ({ value: lp.type, columnKeyForEdit: "type" }))}</td>
                {/* Träslag */}
                <td data-label="Träslag">{renderSharedCell(lagerplats, rowIndex, (lp) => ({ value: lp.tree, columnKeyForEdit: "tree" }))}</td>
                {/* Tjocklek */}
                <td data-label="Tjocklek">{renderSharedCell(lagerplats, rowIndex, (lp) => ({ value: lp.dim, columnKeyForEdit: "dim", isNumeric: true }))}</td>

                {/* Bredd (Kantat specific) */}
                {(selectedCategory === "Kantat" || selectedCategory === null) && (
                  <td data-label="Bredd">
                    {lagerplats.type === "Kantat" || selectedCategory === null ? 
                      renderSharedCell(lagerplats, rowIndex, (lp) => ({ 
                        value: lp.type === "Kantat" ? lp.kantatData?.bredd : (selectedCategory === null ? "-" : ""), 
                        columnKeyForEdit: lp.type === "Kantat" ? "kantatData.bredd" : "",
                        // isNumeric: true (if bredd is number)
                      })) : (selectedCategory !== null && <span>-</span>) // Show dash if specific category selected and item is not of this type
                    }
                  </td>
                )}
                 {/* Max Längd (Kantat specific) */}
                 {(selectedCategory === "Kantat" || selectedCategory === null) && (
                  <td data-label="Max Längd">
                    {lagerplats.type === "Kantat" || selectedCategory === null ?
                      renderSharedCell(lagerplats, rowIndex, (lp) => ({ 
                        value: lp.type === "Kantat" ? lp.kantatData?.max_langd : (selectedCategory === null ? "-" : ""), 
                        columnKeyForEdit: lp.type === "Kantat" ? "kantatData.max_langd" : "",
                        // isNumeric: true (if max_langd is number)
                       })) : (selectedCategory !== null && <span>-</span>)
                    }
                  </td>
                )}

                {/* Tum (Sågat specific) */}
                {(selectedCategory === "Sågat" || selectedCategory === null) && (
                  <td data-label="Tum">
                    {lagerplats.type === "Sågat" || selectedCategory === null ?
                      renderSharedCell(lagerplats, rowIndex, (lp) => ({ 
                        value: lp.type === "Sågat" ? lp.sawData?.tum : (selectedCategory === null ? "-" : ""), 
                        columnKeyForEdit: lp.type === "Sågat" ? "sawData.tum" : "",
                        isNumeric: true 
                      })) : (selectedCategory !== null && <span>-</span>)
                    }
                  </td>
                )}

                {/* Shared: Varv */}
                {(selectedCategory === "Kantat" || selectedCategory === "Okantat" || selectedCategory === null) && (
                  <td data-label="Varv">
                    {renderSharedCell(lagerplats, rowIndex, (lp) => {
                      if (lp.type === "Kantat") return { value: lp.kantatData?.varv, columnKeyForEdit: "kantatData.varv" /* isNumeric: true */ };
                      if (lp.type === "Okantat") return { value: lp.okantatData?.varv, columnKeyForEdit: "okantatData.varv" /* isNumeric: true */ };
                      return { value: (selectedCategory === null ? "-" : ""), columnKeyForEdit: "" };
                    })}
                  </td>
                )}

                {/* Shared: Kvalite */}
                {(selectedCategory === "Kantat" || selectedCategory === "Okantat" || selectedCategory === null) && (
                  <td data-label="Kvalite">
                    {renderSharedCell(lagerplats, rowIndex, (lp) => {
                      if (lp.type === "Kantat") return { value: lp.kantatData?.kvalite, columnKeyForEdit: "kantatData.kvalite" };
                      if (lp.type === "Okantat") return { value: lp.okantatData?.kvalite, columnKeyForEdit: "okantatData.kvalite" };
                      return { value: (selectedCategory === null ? "-" : ""), columnKeyForEdit: "" };
                    })}
                  </td>
                )}

                {/* Shared: Sid/X (Typ) */}
                {(selectedCategory === "Sågat" || selectedCategory === "Okantat" || selectedCategory === null) && (
                  <td data-label="Sid/X">
                    {renderSharedCell(lagerplats, rowIndex, (lp) => {
                      if (lp.type === "Sågat") return { value: lp.sawData?.typ, columnKeyForEdit: "sawData.typ" };
                      if (lp.type === "Okantat") return { value: lp.okantatData?.typ, columnKeyForEdit: "okantatData.typ" };
                      return { value: (selectedCategory === null ? "-" : ""), columnKeyForEdit: "" };
                    })}
                  </td>
                )}

                {/* Shared: Nertork (NT) */}
                {(selectedCategory === "Sågat" || selectedCategory === "Okantat" || selectedCategory === null) && (
                  <td data-label="Nertork">
                    {renderSharedCell(lagerplats, rowIndex, (lp) => {
                      if (lp.type === "Sågat") return { value: lp.sawData?.nt, columnKeyForEdit: "sawData.nt" };
                      if (lp.type === "Okantat") return { value: lp.okantatData?.nt, columnKeyForEdit: "okantatData.nt" };
                      return { value: (selectedCategory === null ? "-" : ""), columnKeyForEdit: "" };
                    })}
                  </td>
                )}

                {/* --- ADD PKTNR CELL --- */}
                {(selectedCategory === "Kantat" || selectedCategory === "Okantat" || selectedCategory === null) && (
                  <td data-label="Pkt Nr">
                    {renderSharedCell(lagerplats, rowIndex, (lp) => {
                      if (lp.type === "Kantat") return { value: lp.kantatData?.pktNr, columnKeyForEdit: "kantatData.pktNr", isNumeric: true };
                      if (lp.type === "Okantat") return { value: lp.okantatData?.pktNr, columnKeyForEdit: "okantatData.pktNr", isNumeric: true };
                      return { value: (selectedCategory === null ? "-" : ""), columnKeyForEdit: "" };
                    })}
                  </td>
                )}
                {/* ------------------------ */}

                {(selectedCategory === "Okantat" || selectedCategory === null) && (
                  <td data-label="Pkt Namn">
                    {renderSharedCell(lagerplats, rowIndex, (lp) => {
                      if (lp.type === "Okantat") return { value: lp.okantatData?.pktNamn, columnKeyForEdit: "okantatData.pktNamn" };
                      return { value: (selectedCategory === null ? "-" : ""), columnKeyForEdit: "" };
                    })}
                  </td>
                )}
                
                {/* Plats */}
                <td data-label="Plats">{renderSharedCell(lagerplats, rowIndex, (lp) => ({ value: lp.location, columnKeyForEdit: "location" }))}</td>
                {/* Ta bort */}
                {hasPermission('lagerplats', 'delete') && (
                <td><button onClick={() => deleteLagerPlats(lagerplats._id)} className={styles.deleteButton}>X</button></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>Föregående</button>
        <span> Sida {currentPage} av {Math.max(1, Math.ceil(filteredLagerplatser.length / itemsPerPage))} </span>
        <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage >= Math.ceil(filteredLagerplatser.length / itemsPerPage)}>Nästa</button>
      </div>


      {/* --- HELP MODAL --- */}
      {isHelpModalOpen && (
        <div className={styles.modalOverlayLager} onClick={closeHelpModal}> {/* Use specific class */}
            <div className={styles.modalContentLager} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.modalTitleLager}>Information</h2>
                <p className={styles.requiredNote}>Fält markerade med * är obligatoriska.</p>
                <div className={styles.helpSectionLager}>
                    <h3>Träslag: *</h3>
                    <ul>
                        <li>Fura = <strong>F</strong></li>
                        <li>Gran = <strong>Gr</strong></li>
                        {/* Add other common tree types */}
                    </ul>
                </div>
                <div className={styles.helpSectionLager}>
                    <h3>Lagerplats:</h3>
                    <ul>
                        <li><strong>jb 3h</strong> (JB, Fack 3, Höger)</li>
                        <li><strong>Kin c2</strong> (Kinda, Sektion C, Plats 2)</li>
                        {/* Add more examples relevant to your system */}
                    </ul>
                </div>
                <div className={styles.helpSectionLager}>
                    <h3>Sågat - Typ (Sid/X):</h3>
                    <ul>
                        <li>Sidobrädor = <strong>Sid</strong></li>
                        <li>Mittenstyck = <strong>2x</strong></li>
                        <li>Mittenstyck = <strong>4x</strong></li>
                        {/* Add other "Typ" codes */}
                    </ul>
                </div>
                <div className={styles.helpSectionLager}>
                    <h3>Sågat/Okantat - Nertork (NT):</h3>
                    <ul>
                        <li>Nertorkat i procent, t.ex. <strong>12%</strong>, <strong>16%</strong></li>
                        <li>Kan lämnas tomt om ej relevant.</li>
                    </ul>
                </div>
                 <div className={styles.helpSectionLager}>
                    <h3>Kantat/Okantat - Kvalité: *</h3>
                    <ul>
                        <li>Standardkvalitéer:</li>
                        <li>A-kvalité = <strong>A / Prima</strong></li>
                        <li>B-kvalité / Ulägg = <strong>B / UL</strong></li>
                        <li>Modell / Skrot = <strong>Mod / Skrot</strong></li>
                        <li>Blånat = <strong>Blå</strong></li>
                    </ul>
                </div>
                <div className={styles.helpSectionLager}>
                        <h3>Extra:</h3>
                        <ul>
                            <li>Dubbelklicka på text inuti rad för att ändra<strong></strong></li>
                            <li>Klicka på valfri översta rad i tabellen för att sortera efter den sorten</li>
                            {/* Add others if applicable */}
                        </ul>
                    </div>
                {/* Add more sections for Kantat: Bredd, Varv, Max Längd if they have specific codes/formats */}
                <button onClick={closeHelpModal} className={styles.modalCloseButtonLager}>
                    Stäng
                </button>
            </div>
        </div>
      )}
      {/* --- END HELP MODAL --- */}
    </div>
    
  );
};

export default LagerPlatsComp;
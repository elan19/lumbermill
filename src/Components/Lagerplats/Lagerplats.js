import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './Lagerplats.module.css';

const LagerPlatsComp = () => {
  const [lagerplatser, setLagerplatser] = useState([]);
  const [formData, setFormData] = useState({
    type: "Sågat", // Default type
    tree: "",
    dim: "",
    location: "",
    sawData: { tum: "", typ: "", nt: "" },
    kantatData: { bredd: "", varv: "", max_langd: "", kvalite: "" },
    okantatData: { varv: "", kvalite: "", typ: "", nt: "" },
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
        kantatData: { bredd: "", varv: "", max_langd: "", kvalite: "" },
        okantatData: { varv: "", kvalite: "", typ: "", nt: "" },
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
        kantatData: { bredd: "", varv: "", max_langd: "", kvalite: "" },
        okantatData: { varv: "", kvalite: "", typ: "", nt: "" },
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
        // Fallback for non-shared keys or direct properties
        return path.split(".").reduce((o, p) => (o && o[p] !== undefined && o[p] !== null ? o[p] : null), obj);
      };

      let aValue = getValue(a, key);
      let bValue = getValue(b, key);

      // Numeric sort for specific keys (adjust as per your schema's data types)
      const numericKeys = ["dim", "sawData.tum", "kantatData.bredd", "kantatData.max_langd"]; 
      // For shared keys that might be numeric:
      if ( (key === "sharedVarv" || key === "sawData.tum") ) { 
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

      <form onSubmit={handleSubmit} className={styles.formLayout}>
        {/* ... form inputs ... (no changes needed here from previous version) */}
        <select name="type" value={formData.type} onChange={handleInputChange}>
          <option value="Sågat">Sågat</option>
          <option value="Kantat">Kantat</option>
          <option value="Okantat">Okantat</option>
        </select>

        <label>Trädslag:</label>
        <input name="tree" value={formData.tree} onChange={handleInputChange} placeholder="Ex. f, gr" required />

        <label>Tjocklek:</label>
        <input type="number" name="dim" value={formData.dim} onChange={handleInputChange} placeholder="Ex. 26, 63" required />

        <label>Lagerplats:</label>
        <input name="location" value={formData.location} onChange={handleInputChange} placeholder="Ex. jb 3h" required />

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
            <label>Bredd:</label>
            <input name="kantatData.bredd" value={formData.kantatData.bredd} placeholder="Ex. 75, 125" onChange={handleInputChange} />
            <label>Varv:</label>
            <input name="kantatData.varv" value={formData.kantatData.varv} placeholder="Ex. 15" onChange={handleInputChange} />
            <label>Max Längd:</label>
            <input name="kantatData.max_langd" value={formData.kantatData.max_langd} placeholder="Ex. 4.3" onChange={handleInputChange} />
            <label>Kvalite:</label>
            <input name="kantatData.kvalite" value={formData.kantatData.kvalite} placeholder="Ex. A, B" onChange={handleInputChange} />
          </>
        )}
        {formData.type === "Okantat" && (
          <>
            <label>Varv:</label>
            <input name="okantatData.varv" value={formData.okantatData.varv} placeholder="Ex. 15" onChange={handleInputChange} />
            <label>Kvalite:</label>
            <input name="okantatData.kvalite" value={formData.okantatData.kvalite} placeholder="Ex. A/Ulägg/Modell/Blå" onChange={handleInputChange} />
            <label>Typ:</label>
            <input name="okantatData.typ" value={formData.okantatData.typ} placeholder="Sid/2X" onChange={handleInputChange} />
            <label>Nertork:</label>
            <input name="okantatData.nt" value={formData.okantatData.nt} placeholder="Ex. 16%" onChange={handleInputChange} />
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
                <th onClick={() => handleSort("sharedTyp")} title="Sid/X"><span>Sid/X</span> {getSortIndicator("sharedTyp")}</th>
              )}

              {/* Shared: Nertork (Sågat, Okantat) */}
              {(selectedCategory === "Sågat" || selectedCategory === "Okantat" || selectedCategory === null) && (
                <th onClick={() => handleSort("sharedNt")} title="Nertork"><span>Nertork</span> {getSortIndicator("sharedNt")}</th>
              )}

              {/* Always Visible */}
              <th onClick={() => handleSort("location")} title="Plats"><span>Plats</span> {getSortIndicator("location")}</th>
              <th>Ta bort</th>
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
                
                {/* Plats */}
                <td data-label="Plats">{renderSharedCell(lagerplats, rowIndex, (lp) => ({ value: lp.location, columnKeyForEdit: "location" }))}</td>
                {/* Ta bort */}
                <td><button onClick={() => deleteLagerPlats(lagerplats._id)} className={styles.deleteButton}>X</button></td>
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
    </div>
  );
};

export default LagerPlatsComp;
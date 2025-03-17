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
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const token = localStorage.getItem('token');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [editing, setEditing] = useState(null); // Track the editing state (row & column)
  const [editedValue, setEditedValue] = useState(''); // Track the value being edited
  const [lastClick, setLastClick] = useState(0);

  // Touch event tracking
  const [lastTouch, setLastTouch] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default to 1



  useEffect(() => {
    fetchLagerplatser();
  }, []);

  const fetchLagerplatser = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/lagerplats', {
        headers: {
          Authorization: `Bearer ${token}`, // Add token to Authorization header
        },
      });
      setLagerplatser(response.data);
    } catch (err) {
      console.error('Failed to fetch lagerplatser:', err);
    }
  };

  const handleDoubleClick = (rowIndex, columnKey, currentValue, isTouchEvent) => {
    const currentTime = Date.now();
    console.log("test");
  
    // For mouse events (double-click)
    if (!isTouchEvent && currentTime - lastClick < 300) {
      // Detected double-click (within 300ms)
      setEditing({ rowIndex, columnKey });
      setEditedValue(currentValue); // Set value for editing
    }
  
    // For touch events (double-tap)
    if (isTouchEvent && currentTime - lastTouch < 300) {
      // Detected double-tap (within 300ms)
      setEditing({ rowIndex, columnKey });
      setEditedValue(currentValue); // Set value for editing
    }
  
    setLastClick(currentTime); // Update last click time
    setLastTouch(currentTime); // Update last touch time
  };
  
  const handleSave = async (rowIndex, columnKey) => {
    const updatedLagerplatser = [...lagerplatser]; // Clone array to avoid state mutation issues
  
    // Extract object path and field to update
    const keys = columnKey.split('.'); // Handles nested keys like 'kantatData.bredd'
    const lastKey = keys.pop(); // The actual field to update
    let currentObj = updatedLagerplatser[rowIndex];
  
    // Navigate to the correct nested object
    keys.forEach((key) => {
      if (!currentObj[key]) {
        currentObj[key] = {}; // Ensure object exists to prevent errors
      }
      currentObj = currentObj[key];
    });
  
    // Update the target field
    currentObj[lastKey] = editedValue;
  
    const updatedField = {
      [columnKey]: editedValue, // Send only the updated field
    };
  
    console.log("Updating field:", updatedField);
  
    try {
      // Send only the modified field to the server
      await axios.put(
        `http://localhost:5000/api/lagerplats/${updatedLagerplatser[rowIndex]._id}`,
        updatedField, // Send only the changed field
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      setLagerplatser(updatedLagerplatser); // Update state
      setEditing(null); // Exit editing mode
    } catch (err) {
      console.error("Failed to save updated data:", err);
    }
  };
  
  

  

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // If changing type, reset the specific fields
    if (name === "type") {
      setFormData({
        ...formData,
        type: value,
        sawData: { tum: "", typ: "", nt: "" },
        kantatData: { bredd: "", varv: "", max_langd: "", kvalite: "" },
      });
      return;
    }

    // Handle nested object updates
    if (name.startsWith("sawData.") || name.startsWith("kantatData.")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: { ...formData[parent], [child]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(formData);
    try {
      await axios.post('http://localhost:5000/api/lagerplats', formData, {
        headers: {
          Authorization: `Bearer ${token}`, // Add token to Authorization header
        },
      });
      fetchLagerplatser();
      setFormData({ 
        type: 'Sågat', tree: '', dim: '', location: '', sawData: { tum: "", typ: "", nt: "" },
        kantatData: { bredd: "", varv: "", max_langd: "", kvalite: "" }
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
      // Reset to default when the same key is clicked again
      direction = "none";
    }
    setSortConfig({ key, direction });
  
    if (direction !== "none") {
      const sortedData = [...lagerplatser].sort((a, b) => {
        const getValue = (obj, path) => path.split(".").reduce((o, p) => (o ? o[p] : "-"), obj);
  
        const aValue = getValue(a, key) || "-";
        const bValue = getValue(b, key) || "-";
  
        if (key === "nt") {
          // Sort with '-' first and 'ja' second
          if (aValue === bValue) return 0;
          if (aValue === "-") return direction === "ascending" ? -1 : 1;
          if (bValue === "-") return direction === "ascending" ? 1 : -1;
          return direction === "ascending" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
  
        // Default sorting for other keys
        if (aValue < bValue) return direction === "ascending" ? -1 : 1;
        if (aValue > bValue) return direction === "ascending" ? 1 : -1;
        return 0;
      });
  
      setLagerplatser(sortedData);
    }
  };
  
  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'ascending') return '▲';
      if (sortConfig.direction === 'descending') return '▼';
    }
    return '⬍'; // Default indicator when not sorted
  };

  const deleteLagerPlats = async (lagerPlatsId) => {
    try {
      await axios.delete(`http://localhost:5000/api/lagerplats/${lagerPlatsId}`,{
        headers: {
          Authorization: `Bearer ${token}`, // Add token to Authorization header
        },
      });
      fetchLagerplatser();
    } catch (err) {
      console.error('Failed to remove lagerplats:', err);
    }
  }

  // Filter lagerplatser based on selectedCategory
  const filteredLagerplatser = selectedCategory
    ? lagerplatser.filter((item) => item.type === selectedCategory)
    : lagerplatser;

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLagerplatser.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  return (
    <div className={styles.lagerplatsContainer}>
      <h1>Lagerplats</h1>

      <form onSubmit={handleSubmit}>
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

        {/* Sågat-specific fields */}
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

        {/* Kantat-specific fields */}
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

        <button type="submit">Lägg till</button>
      </form>

      <div className={styles.tableDeciderDiv}>
        <button 
          className={selectedCategory === 'Sågat' ? styles.activeButton : ''} 
          onClick={() => setSelectedCategory('Sågat')}
        >
          Sågat
        </button>
        
        <button 
          className={selectedCategory === 'Kantat' ? styles.activeButton : ''} 
          onClick={() => setSelectedCategory('Kantat')}
        >
          Kantat
        </button>
        
        <button 
          className={selectedCategory === 'Okantat' ? styles.activeButton : ''} 
          onClick={() => setSelectedCategory('Okantat')}
        >
          Okantat
        </button>
        
        <button 
          className={selectedCategory === null ? styles.activeButton : ''} 
          onClick={() => setSelectedCategory(null)}
        >
          Visa alla
        </button>

        <select 
            className={styles.itemsPerPage}
            value={itemsPerPage} 
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value)); 
              setCurrentPage(1); // Reset to page 1 when changing items per page
            }}
          >
            <option value="" disabled>Visa per sida</option>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">25</option>
            <option value="50">50</option>
          </select>
        </div>

      {/* Wrap the table in a scrollable div */}
      <div className={styles.tableContainer}>
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort("type")} title="Kategori">
                <span>Kategori</span> {getSortIndicator("type")}
              </th>
              <th onClick={() => handleSort("tree")} title="Träslag">
                <span>Träslag</span> {getSortIndicator("tree")}
              </th>
              <th onClick={() => handleSort("dim")} title="Tjocklek">
                <span>Tjocklek</span> {getSortIndicator("dim")}
              </th>

              {/* Conditionally render Kantat-specific columns */}
              {selectedCategory === "Kantat" || selectedCategory === null ? (
                <>
                  <th onClick={() => handleSort("kantatData.bredd")} title="Bredd">
                    <span>Bredd</span> {getSortIndicator("kantatData.bredd")}
                  </th>
                  <th onClick={() => handleSort("kantatData.varv")} title="Varv">
                    <span>Varv</span> {getSortIndicator("kantatData.varv")}
                  </th>
                  <th onClick={() => handleSort("kantatData.max_langd")} title="Max Längd">
                    <span>Max Längd</span> {getSortIndicator("kantatData.max_langd")}
                  </th>
                  <th onClick={() => handleSort("kantatData.kvalite")} title="Kvalitet">
                    <span>Kvalitet</span> {getSortIndicator("kantatData.kvalite")}
                  </th>
                </>
              ) : null}

              {/* Conditionally render Sågat-specific columns */}
              {selectedCategory === "Sågat" || selectedCategory === null ? (
                <>
                  <th onClick={() => handleSort("sawData.tum")} title="Tum">
                    <span>Tum</span> {getSortIndicator("sawData.tum")}
                  </th>
                  <th onClick={() => handleSort("sawData.typ")} title="Sid/X">
                    <span>Sid/X</span> {getSortIndicator("sawData.typ")}
                  </th>
                  <th onClick={() => handleSort("sawData.nt")} title="Nertork">
                    <span>Nertork</span> {getSortIndicator("sawData.nt")}
                  </th>
                </>
              ) : null}

              <th onClick={() => handleSort("location")} title="Plats">
                <span>Plats</span> {getSortIndicator("location")}
              </th>

              <th>Ta bort</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((lagerplats, rowIndex) => (
              <tr key={lagerplats._id}>
                <td data-label="Kategori">
                  {editing?.rowIndex === rowIndex && editing?.columnKey === "type" ? (
                    <input 
                      value={editedValue}
                      onChange={(e) => setEditedValue(e.target.value)} 
                      onBlur={() => handleSave(rowIndex, "type")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault(); // Prevent new line in input
                          handleSave(rowIndex, "type");
                        }
                      }}
                    />
                  ) : (
                    <span
                      onClick={(e) => handleDoubleClick(rowIndex, 'type', lagerplats.type, e.type === 'touchstart')}
                    >
                      {lagerplats.type}
                    </span>
                  )}
                </td>

                <td data-label="Träslag">
                  {editing?.rowIndex === rowIndex && editing?.columnKey === "tree" ? (
                    <input
                      value={editedValue}
                      onChange={(e) => setEditedValue(e.target.value)}
                      onBlur={() => handleSave(rowIndex, "tree")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault(); // Prevent new line in input
                          handleSave(rowIndex, "tree");
                        }
                      }}
                    />
                  ) : (
                    <span
                      onClick={(e) => handleDoubleClick(rowIndex, 'tree', lagerplats.tree, e.type === 'touchstart')}
                    >
                      {lagerplats.tree}
                    </span>
                  )}
                </td>

                <td data-label="Tjocklek">
                  {editing?.rowIndex === rowIndex && editing?.columnKey === "dim" ? (
                    <input 
                      type="number"
                      value={editedValue}
                      onChange={(e) => setEditedValue(e.target.value)} 
                      onBlur={() => handleSave(rowIndex, "dim")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault(); // Prevent new line in input
                          handleSave(rowIndex, "dim");
                        }
                      }}
                    />
                  ) : (
                    <span
                      onClick={(e) => handleDoubleClick(rowIndex, 'dim', lagerplats.dim, e.type === 'touchstart')}
                    >
                      {lagerplats.dim}
                    </span>
                  )}
                </td>

                {/* Conditionally render Kantat-specific data */}
                {selectedCategory === "Kantat" || selectedCategory === null ? (
                  <>
                    <td data-label="Bredd">
                      {editing?.rowIndex === rowIndex && editing?.columnKey === "kantatData.bredd" ? (
                        <input 
                          value={editedValue}
                          onChange={(e) => setEditedValue(e.target.value)} 
                          onBlur={() => handleSave(rowIndex, "kantatData.bredd")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault(); // Prevent new line in input
                              handleSave(rowIndex, "kantatData.bredd");
                            }
                          }}
                        />
                      ) : (
                        <span onClick={(e) => handleDoubleClick(rowIndex, 'kantatData.bredd', lagerplats.kantatData?.bredd, e.type === 'touchstart')}>
                          {lagerplats.kantatData?.bredd || "-"}
                        </span>
                      )}
                    </td>
                    <td data-label="Varv">
                      {editing?.rowIndex === rowIndex && editing?.columnKey === "kantatData.varv" ? (
                        <input 
                          value={editedValue}
                          onChange={(e) => setEditedValue(e.target.value)} 
                          onBlur={() => handleSave(rowIndex, "kantatData.varv")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault(); // Prevent new line in input
                              handleSave(rowIndex, "kantatData.varv");
                            }
                          }}
                        />
                      ) : (
                        <span onClick={(e) => handleDoubleClick(rowIndex, 'kantatData.varv', lagerplats.kantatData?.varv, e.type === 'touchstart')}>
                          {lagerplats.kantatData?.varv || "-"}
                        </span>
                      )}
                    </td>
                    <td data-label="Max Längd">
                      {editing?.rowIndex === rowIndex && editing?.columnKey === "kantatData.max_langd" ? (
                        <input 
                          value={editedValue}
                          onChange={(e) => setEditedValue(e.target.value)} 
                          onBlur={() => handleSave(rowIndex, "kantatData.max_langd")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault(); // Prevent new line in input
                              handleSave(rowIndex, "kantatData.max_langd");
                            }
                          }}
                        />
                      ) : (
                        <span onClick={(e) => handleDoubleClick(rowIndex, 'kantatData.max_langd', lagerplats.kantatData?.max_langd, e.type === 'touchstart')}>
                          {lagerplats.kantatData?.max_langd || "-"}
                        </span>
                      )}
                    </td>
                    <td data-label="Kvalitet">
                      {editing?.rowIndex === rowIndex && editing?.columnKey === "kantatData.kvalite" ? (
                        <input 
                          value={editedValue}
                          onChange={(e) => setEditedValue(e.target.value)} 
                          onBlur={() => handleSave(rowIndex, "kantatData.kvalite")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault(); // Prevent new line in input
                              handleSave(rowIndex, "kantatData.kvalite");
                            }
                          }}
                        />
                      ) : (
                        <span onClick={(e) => handleDoubleClick(rowIndex, 'kantatData.kvalite', lagerplats.kantatData?.kvalite, e.type === 'touchstart')}>
                          {lagerplats.kantatData?.kvalite || "-"}
                        </span>
                      )}
                    </td>
                  </>
                ) : null}

                {/* Conditionally render Sågat-specific data */}
                {selectedCategory === "Sågat" || selectedCategory === null ? (
                  <>
                    <td data-label="Tum">
                      {editing?.rowIndex === rowIndex && editing?.columnKey === "sawData.tum" ? (
                        <input 
                          type="number"
                          value={editedValue}
                          onChange={(e) => setEditedValue(e.target.value)} 
                          onBlur={() => handleSave(rowIndex, "sawData.tum")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault(); // Prevent new line in input
                              handleSave(rowIndex, "sawData.tum");
                            }
                          }}
                        />
                      ) : (
                        <span onClick={(e) => handleDoubleClick(rowIndex, 'sawData.tum', lagerplats.sawData?.tum, e.type === 'touchstart')}>
                          {lagerplats.sawData?.tum || "-"}
                        </span>
                      )}
                    </td>
                    <td data-label="Sid/X">
                      {editing?.rowIndex === rowIndex && editing?.columnKey === "sawData.typ" ? (
                        <input 
                          value={editedValue}
                          onChange={(e) => setEditedValue(e.target.value)} 
                          onBlur={() => handleSave(rowIndex, "sawData.typ")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault(); // Prevent new line in input
                              handleSave(rowIndex, "sawData.typ");
                            }
                          }}
                        />
                      ) : (
                        <span onClick={(e) => handleDoubleClick(rowIndex, 'sawData.typ', lagerplats.sawData?.typ, e.type === 'touchstart')}>
                          {lagerplats.sawData?.typ || "-"}
                        </span>
                      )}
                    </td>
                    <td data-label="NT">
                      {editing?.rowIndex === rowIndex && editing?.columnKey === "sawData.nt" ? (
                        <input 
                          value={editedValue}
                          onChange={(e) => setEditedValue(e.target.value)} 
                          onBlur={() => handleSave(rowIndex, "sawData.nt")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault(); // Prevent new line in input
                              handleSave(rowIndex, "sawData.nt");
                            }
                          }}
                        />
                      ) : (
                        <span onClick={(e) => handleDoubleClick(rowIndex, 'sawData.nt', lagerplats.sawData?.nt, e.type === 'touchstart')}>
                          {lagerplats.sawData?.nt || "-"}
                        </span>
                      )}
                    </td>
                  </>
                ) : null}

                <td data-label="Plats">
                  {editing?.rowIndex === rowIndex && editing?.columnKey === "location" ? (
                    <input 
                      value={editedValue}
                      onChange={(e) => setEditedValue(e.target.value)} 
                      onBlur={() => handleSave(rowIndex, "location")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault(); // Prevent new line in input
                          handleSave(rowIndex, "location");
                        }
                      }}
                    />
                  ) : (
                    <span onClick={(e) => handleDoubleClick(rowIndex, 'location', lagerplats.location, e.type === 'touchstart')}>
                      {lagerplats.location}
                    </span>
                  )}
                </td>

                <td>
                  <button
                    onClick={() => deleteLagerPlats(lagerplats._id)}
                    className={styles.deleteButton}
                  >
                    X
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className={styles.pagination}>
        <button 
          onClick={() => setCurrentPage(currentPage - 1)} 
          disabled={currentPage === 1}
        >
          Föregående
        </button>

        <span> Sida {currentPage} av {Math.ceil(filteredLagerplatser.length / itemsPerPage)} </span>

        <button 
          onClick={() => setCurrentPage(currentPage + 1)} 
          disabled={currentPage >= Math.ceil(filteredLagerplatser.length / itemsPerPage)}
        >
          Nästa
        </button>
      </div>
    </div>
  );
};

export default LagerPlatsComp;
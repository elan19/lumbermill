import React, { useState } from "react";
import axios from "axios";

const CreatePrilista = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [customer, setCustomer] = useState("");
  const [location, setLocation] = useState("");
  const [dimensions, setDimensions] = useState([
    { quantity: "", size: "", type: "", info: "", measureLocation: "" },
  ]);
  const [error, setError] = useState(null);

  const handleDimensionChange = (index, field, value) => {
    const updatedDimensions = dimensions.map((dimension, i) =>
      i === index ? { ...dimension, [field]: value } : dimension
    );
    setDimensions(updatedDimensions);
  };

  const addDimension = () => {
    setDimensions([...dimensions, { quantity: "", size: "", type: "", info: "" }]);
  };

  const removeDimension = (index) => {
    setDimensions(dimensions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newPrilista = { orderNumber, customer, location, dimensions };

    try {
      const response = await axios.post("/api/prilista/create", newPrilista);
      alert("PRILISTA created successfully!");
      setOrderNumber("");
      setCustomer("");
      setLocation("");
      setDimensions([{ quantity: "", size: "", type: "", info: "" }]);
    } catch (err) {
      setError("Failed to create PRILISTA. Please try again.");
    }
  };

  return (
    <div className="create-prilista">
      <h2>Create New PRILISTA</h2>

      <form onSubmit={handleSubmit}>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <label>
          Order Number:
          <input
            type="number"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
          />
        </label>
        <label>
          Customer:
          <input
            type="text"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            required
          />
        </label>
        <label>
          Location:
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </label>
        <fieldset>
          <legend>Dimensions</legend>
          {dimensions.map((dimension, index) => (
            <div key={index} className="dimension">
              <label>
                Quantity:
                <input
                  type="number"
                  value={dimension.quantity}
                  onChange={(e) =>
                    handleDimensionChange(index, "quantity", e.target.value)
                  }
                  required
                />
              </label>
              <label>
                Size:
                <input
                  type="text"
                  value={dimension.size}
                  onChange={(e) => handleDimensionChange(index, "size", e.target.value)}
                  required
                />
              </label>
              <label>
                Type:
                <input
                  type="text"
                  value={dimension.type}
                  onChange={(e) => handleDimensionChange(index, "type", e.target.value)}
                  required
                />
              </label>
              <label>
                Info:
                <input
                  type="text"
                  value={dimension.info}
                  onChange={(e) => handleDimensionChange(index, "info", e.target.value)}
                  required
                />
              </label>
              <button type="button" onClick={() => removeDimension(index)}>
                Remove Dimension
              </button>
            </div>
          ))}
          <button type="button" onClick={addDimension}>
            Add Dimension
          </button>
        </fieldset>
        <button type="submit">Create PRILISTA</button>
      </form>
    </div>
  );
};

export default CreatePrilista;

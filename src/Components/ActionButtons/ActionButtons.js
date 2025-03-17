// ActionButtons.js
import React from "react";

const ActionButtons = ({ onAddOrder, onUpdateOrder, onDeleteOrder }) => {
  return (
    <div className="action-buttons">
      <button onClick={onAddOrder}>Add Order</button>
      <button onClick={onUpdateOrder}>Update Order</button>
      <button onClick={onDeleteOrder}>Delete Order</button>
    </div>
  );
};

export default ActionButtons;

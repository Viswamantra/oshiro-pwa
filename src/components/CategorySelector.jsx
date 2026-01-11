import React from "react";

export default function CategorySelector({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: 6,
        minWidth: 180,
        cursor: "pointer",
      }}
    >
      <option value="">All</option>

      <option value="EHuriAgh3jlwpZhvGi2N">Food</option>
      <option value="PJYuU0ltUCkaUlRw55pm">Medicals</option>
      <option value="Rb0wToy7ry1vsRRtdKy0">Other Services</option>
      <option value="boaZo4fHBaPjkNDopOsn">Education</option>
      <option value="cRjtnpg5oHQhSNt5vfCV">Hospitals</option>
      <option value="dOculBYSS5tDphxvFvcl">Beauty & Spa</option>
      <option value="zVBYDhPomvWi3rtBFbFj">Fashion & Clothing</option>
      <option value="zXnSCXG0Qff8e4U4XcGX">Home Kitchen</option>
    </select>
  );
}

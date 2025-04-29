// ./Views/Products/ProductDetail.js
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { productDetails } from '../../ProductData/ProductData'; // Adjust path if needed
import './ProductDetail.css'; // Create this CSS file

const ProductDetail = () => {
  const { productId } = useParams(); // Get the 'productId' from the URL
  const product = productDetails[productId];

  // Handle case where product ID is invalid
  if (!product) {
    return (
      <div className="product-detail-page not-found">
        <h2>Product Not Found</h2>
        <p>Sorry, we couldn't find details for the product ID "{productId}".</p>
        <Link to="/products">Back to Products</Link>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <section className="page-header">
        <h1>{product.name}</h1>
        {product.qualityDescriptor && <p className="quality-descriptor">{product.qualityDescriptor}</p>}
      </section>

      <section className="detail-content">
        {/* Column for Specifications */}
        <div className="detail-specs">
          <div className="back-link-container-top">
            <Link to="/products" className="back-link">← Tillbaka</Link>
          </div>
          <h2>Specifikationer</h2>
          <dl className="spec-list">
            {product.specs.map((spec, index) => (
              <React.Fragment key={index}>
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </React.Fragment>
            ))}
          </dl>
        </div>

        {/* Column for Visuals and Extras */}
        <div className="detail-visuals">
          {product.stampImage && (
            <div className="visual-item">
              <h3>Märkning Exempel</h3>
              <img src={product.stampImage} alt={`${product.name} stämpel`} />
            </div>
          )}
          {product.logDiagramImage && (
            <div className="visual-item">
              <h3>Sågsnitt Diagram</h3>
              <img src={product.logDiagramImage} alt={`Sågsnitt för ${product.name}`} />
            </div>
          )}
          {product.certificationLogo && (
             <div className="visual-item certification">
                <h3>Certifiering</h3>
                <img src={product.certificationLogo} alt={`${product.certification} Certified`} />
             </div>
           )}
          {product.pdfUrl && product.pdfUrl !== '#' && (
            <div className="visual-item pdf-download">
              <a href={product.pdfUrl} target="_blank" rel="noopener noreferrer" className="pdf-button">
                <span className="pdf-icon">📄</span> {/* Replace with better icon */}
                Högupplöst PDF för utskrift
              </a>
            </div>
          )}
        </div>
      </section>

      <div className="back-link-container">
         <Link to="/products" className="back-link">← Tillbaka till Produkter</Link>
      </div>
    </div>
  );
};

export default ProductDetail;
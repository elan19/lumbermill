// ./Views/Products/Products.js
import React from 'react';
import './Products.css'; // Ensure this CSS file exists and is styled
import { Link } from 'react-router-dom';

// We don't strictly need productList here anymore if we hardcode category sections,
// but the path needs to be correct for ProductDetail.js later.
// Assuming ProductData.js is in 'src/ProductData/'
// import { productList } from '../../ProductData/ProductData'; // Example path

import sidobrador from '../../images/sidobrador.jpg';
import staplar from '../../images/staplar.jpg';
import drone_shot from '../../images/dronarbild.png';
import close_shot from '../../images/close_shot.jpg';
import sustain from '../../images/sustain.jpg';

/*const picsumUrl = 'https://picsum.photos/';
const productImgW = '500';
const productImgH = '300';
const sideboardPlaceholder = `${picsumUrl}${productImgW}/${productImgH}?random=30`;
const stambradorPlaceholder = `${picsumUrl}${productImgW}/${productImgH}?random=31`;
const massivaAmnenPlaceholder = `${picsumUrl}${productImgW}/${productImgH}?random=32`;
const kantadePlaceholder = `${picsumUrl}${productImgW}/${productImgH}?random=33`;
const specialtyCutsImg = `${picsumUrl}${productImgW}/${productImgH}?random=34`;*/


const Products = () => {
  return (
    <div className="products-page">
      <section className="page-header">
        <h1>Våra produkter</h1>
        <p>Utforska vårt utbud av högkvalitativa, hållbara trälösningar.</p>
      </section>

      {/* Section for Sidobrädor (Gran/Furu) */}
      <section className="product-category">
        <div className="product-image">
          <img src={sidobrador} alt="Sidobrädor (Gran/Furu)" />
        </div>
        <div className="product-details">
          <h2>Sidobrädor (Gran & Furu)</h2>
          <p>Högkvalitativa sidobrädor sågade från stockar av gran och furu.</p>
          <ul>
            <li>Trädsort: Gran (Spruce), Furu (Pine)</li>
            <li>Kvalité: Olika sorter (e.g., Prima)</li>
            <li>Torkning: Lufttork / torkanläggning</li>
            {/* Link to Gran Sidobrädor as the primary example */}
            <li><Link to="/products/gran-sidobrador" className="details-link-inline">Visa alla Gran Sidobrädor Specs</Link></li>
             {/* Link to Furu Sidobrädor */}
            <li><Link to="/products/furu-sidobrador" className="details-link-inline">Visa alla Furu Sidobrädor Specs</Link></li>
          </ul>
          {/* Optional: General button for the category if needed */}
          {/* <Link to="/products/gran-sidobrador" className="details-button">View Example</Link> */}
        </div>
      </section>

      {/* Section for Stambrädor (Gran/Furu) */}
      <section className="product-category alt-layout">
        <div className="product-details">
          <h2>Stambrädor (Gran & Furu)</h2>
          <p>Mittstycket (stambrädor) erbjuder vanligtvis bredare dimensioner och potentiellt högre kvalitet på spannmål från stockens kärna. Finns i gran och furu.</p>
           <ul>
            <li>Trädsorter: Gran (Spruce), Furu (Pine)</li>
            <li>Kvalité: Olika sorter (e.g., Prima)</li>
            <li>Torkning: Lufttork / torkanläggning</li>
             {/* Link to Gran Stambrädor */}
            <li><Link to="/products/gran-stambrador" className="details-link-inline">Visa alla Gran Stambrädor Specs</Link></li>
            {/* Link to Furu Stambrädor */}
            <li><Link to="/products/furu-stambrador" className="details-link-inline">Visa alla Furu Stambrädor Specs</Link></li>
          </ul>
        </div>
         <div className="product-image">
          <img src={staplar} alt="Stambrädor (Gran/Furu)" />
        </div>
      </section>

      {/* Section for Furu Massiva Ämnen */}
      <section className="product-category">
        <div className="product-image">
          <img src={close_shot} alt="Furu Massiva Ämnen" />
        </div>
        <div className="product-details">
          <h2>Furu Massiva Ämnen</h2>
          <p>Kantade massiva ämnen i furu redo för vidare bearbetning. Hög kvalitet och utsynad styckvis av personal.</p>
          <ul>
            <li>Trädsort: Furu (Pine)</li>
            <li>Kvalité: Olika sorter (Prima, B-kvalitet)</li>
            <li>Dimensioner: 50x75 - 50x150, 63x63 - 63x150, 75x75 - 75x150 <span className='product-span'>(Från - Till)</span></li>
             {/* Link to Furu Massiva Ämnen */}
          </ul>
           {/* Use Link styled as a button */}
           <Link to="/products/furu-massiva-amnen" className="details-button">
             Visa Specifikationer
           </Link>
        </div>
      </section>

      {/* Section for Kantade Furusidobrädor */}
       <section className="product-category alt-layout">
         <div className="product-details">
          <h2>Kantade Furusidobrädor</h2>
          <p>Kantade furusidobrädor sideboards med dimensionel konsistens. Hög kvalitet och utsynad styckvis av personal.</p>
           <ul>
            <li>Trädsort: Furu (Pine)</li>
            <li>Kvalité: Prima</li>
            <li>Dimensioner: 16x75 - 16-150 upp till 38x100 - 38x200 <span className='product-span'>(Från - Till)</span></li>
             {/* Link to Kantade Furusidobrädor */}
          </ul>
           {/* Use Link styled as a button */}
           <Link to="/products/kantade-furusidobrador" className="details-button">
             Visa Specifikationer
           </Link>
        </div>
        <div className="product-image">
          <img src={sustain} alt="Kantade Furusidobrädor" />
        </div>
      </section>

        <section className="product-category alt-layout">
            <div className="product-details">
            <h2>Anpassade beställningar</h2>
            <p>Utöver standardmått och beställningar erbjuder vi även unika virkesprodukter skräddarsydda för dina specifika projektbehov. Kontakta oss för att diskutera dina krav.</p>
            <Link to="/contact" className="details-button">
            Kontakta oss om anpassade beställningar
           </Link>
            </div>
            <div className="product-image">
            <img src={drone_shot} alt="Specialty Cuts Placeholder" />
            </div>
        </section>

    </div> // Ensure this closing div matches the opening 'products-page' div
  );
};

export default Products;
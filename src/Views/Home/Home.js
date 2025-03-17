import React from 'react';
import './home.css'; // We will create this file for styling

function Home() {
  return (
    <div className="home">
      <div className='heroDiv'>
        <h1>Ansgarius Svensson AB</h1>
        <p>Ett företag som tar tillvara på skogens resurser</p>
        <p>av tall, gran och lärk</p>
        <a className="heroBtn" href="/about">Läs mer</a>
      </div>
      <div className='aboutDiv'>
        <h1>Om oss</h1>
      </div>
      <div className='productsDiv'>

      </div>
    </div>
  );
}

export default Home;
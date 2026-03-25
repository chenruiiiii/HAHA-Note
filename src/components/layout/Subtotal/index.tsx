import React from 'react';
import './style.scss';
import NewSubtotal from './components/NewSubtotal';
import SubtotalList from './components/SubtotalLIist';

const Subtotal = () => {
  return (
    <div className="subtotal">
      <div className="sub-left">
        <NewSubtotal></NewSubtotal>
      </div>
      <div className="sub-right">
        <SubtotalList />
      </div>
    </div>
  );
};

export default Subtotal;

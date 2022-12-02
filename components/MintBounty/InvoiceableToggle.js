import React, { useState } from 'react';
import ToolTipNew from '../Utils/ToolTipNew';

const InvoiceableToggle = () => {
  const [invoice, setInvoice] = useState(false);
  return (
    <div className='flex flex-col  gap-2 py-2 w-full items-start  text-base bg-[#161B22]'>
      <div className='flex items-center gap-2 font-semibold'>
        Is this Contract invoiceable?
        <ToolTipNew toolTipText={'Do you want an invoice for this contract?'}>
          <div className='cursor-help rounded-full border border-[#c9d1d9] text-sm aspect-square leading-4 h-4 box-content text-center font-bold text-primary'>
            ?
          </div>
        </ToolTipNew>
      </div>
      <div className='flex-1 w-full'>
        <div className='flex text-sm rounded-sm text-primary '>
          <ToolTipNew
            innerStyles={'flex'}
            relativePosition={'-left-2'}
            outerStyles={'relative bottom-1'}
            toolTipText={'Invoicing feature coming soon'}
          >
            <button
              disabled={true}
              onClick={() => setInvoice(true)}
              className={`cursor-not-allowed w-fit min-w-[80px] py-[5px] px-4 rounded-l-sm border whitespace-nowrap ${
                invoice ? 'bg-secondary-button border-secondary-button' : ''
              }  border-web-gray`}
            >
              Yes
            </button>
          </ToolTipNew>
          <button
            onClick={() => setInvoice(false)}
            className={`w-fit min-w-[80px] py-[5px] px-4 border-l-0 rounded-r-sm border whitespace-nowrap ${
              !invoice
                ? 'bg-secondary-button border-secondary-button'
                : 'hover:bg-secondary-button hover:border-secondary-button border-web-gray'
            } `}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceableToggle;

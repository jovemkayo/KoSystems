import type {ReactNode} from 'react';
export function BrandHeader({children}:{children?:ReactNode}) {
  return <header className="account-top no-print">
    <div className="brand-lockup">
      <a className="brand" href="#main" aria-label="Order Workbench"><img src="/demos/orderworkbench/brand/order-workbench.png" alt="" width="34" height="34"/><span>order<span className="brand-light">workbench</span></span></a>
      <span className="developed-by">desenvolvido por</span>
      <a className="ko-brand" href="https://kosystems.com.br" target="_blank" rel="noopener noreferrer" aria-label="KO Systems"><img src="/demos/orderworkbench/brand/ko-systems.png" alt="KO Systems" width="76" height="76"/></a>
    </div>
    {children}
  </header>;
}

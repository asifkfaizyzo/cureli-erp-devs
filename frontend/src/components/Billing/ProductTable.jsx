import ProductRow from "../Billing/ProductRow";
import { billProducts } from "../data/bill";

const ProductTable = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">

      {/* Scrollable table container */}
      <div className="max-h-[245px] overflow-y-auto">

        <table className="min-w-full border-collapse">

          {/* TABLE HEADER */}
          <thead className="sticky top-0 z-10 bg-[#000060] text-white">
            <tr className="text-[11px]">
              <th className="px-2 py-2  text-left w-10">Sl.No</th>
              <th className="px-2 py-2  text-left">Product Name</th>
              <th className="px-2 py-2  text-left">Batch</th>
              <th className="px-2 py-2  text-right">Rate</th>
              <th className="px-2 py-2  text-center">Qty</th>
              <th className="px-2 py-2  text-center">Exp</th>
              <th className="px-2 py-2  text-center">Type</th>
              <th className="px-2 py-2  text-center">Category</th>
              <th className="px-2 py-2  text-center">Stock</th>
              <th className="px-2 py-2  text-center">Rack</th>
              <th className="px-2 py-2  text-right">Tax%</th>
              <th className="px-2 py-2  text-right">Tax Amt</th>
              <th className="px-2 py-2  text-right">Dis%</th>
              <th className="px-2 py-2  text-right">MRP</th>
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody className="border-4 border-white rounded-xl">
  {billProducts.map((product, index) => (
    <ProductRow key={index} index={index} item={product} />
  ))}
</tbody>


        </table>

      </div>
    </div>
  );
};

export default ProductTable;

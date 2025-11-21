import ProductRow from "../Billing/ProductRow";

const dummyProducts = Array.from({ length: 8 }).map((_, i) => ({
  name: "paracetamol",
  batch: "E7656T",
  rate: 10,
  qty: 5,
  exp: "12/26",
  type: "Antibiotics",
  category: "Medicine",
  stock: 100,
  rack: "S8",
  tax: 1.5,
  taxAmt: 1.5,
  disc: 0,
  mrp: 11.5,
}));

const ProductTable = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-auto max-h-[340px]">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[#000060] text-white text-[11px]">
              <th className="px-2 py-2 text-left w-10">Sl.No</th>
              <th className="px-2 py-2 text-left">Product Name</th>
              <th className="px-2 py-2 text-left">Batch</th>
              <th className="px-2 py-2 text-right">Rate</th>
              <th className="px-2 py-2 text-center">Qty</th>
              <th className="px-2 py-2 text-center">Exp</th>
              <th className="px-2 py-2 text-center">Type</th>
              <th className="px-2 py-2 text-center">Category</th>
              <th className="px-2 py-2 text-center">Stock</th>
              <th className="px-2 py-2 text-center">Rack</th>
              <th className="px-2 py-2 text-right">Tax%</th>
              <th className="px-2 py-2 text-right">Tax Amt</th>
              <th className="px-2 py-2 text-right">Dis%</th>
              <th className="px-2 py-2 text-right">MRP</th>
            </tr>
          </thead>
          <tbody>
            {dummyProducts.map((p, idx) => (
              <ProductRow key={idx} index={idx} item={p} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;

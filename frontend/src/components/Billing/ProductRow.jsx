const ProductRow = ({ index, item }) => {
  return (
    <tr
      className="
        text-[11px] text-gray-700 
        border-b border-gray-200
        hover:bg-gray-50
      "
    >
      <td className="px-2 py-1.5 text-center w-8">{index + 1}</td>
      <td className="px-2 py-1.5">{item.name}</td>
      <td className="px-2 py-1.5 text-center">{item.batch}</td>
      
      <td className="px-2 py-1.5 text-right">
        {item.rate.toFixed(2)}
      </td>

      <td className="px-2 py-1.5 text-center">{item.qty}</td>
      <td className="px-2 py-1.5 text-center">{item.exp}</td>
      <td className="px-2 py-1.5 text-center">{item.type}</td>
      <td className="px-2 py-1.5 text-center">{item.category}</td>
      <td className="px-2 py-1.5 text-center">{item.stock}</td>
      <td className="px-2 py-1.5 text-center">{item.rack}</td>

      <td className="px-2 py-1.5 text-right">{item.tax}%</td>

      <td className="px-2 py-1.5 text-right">
        {item.taxAmt.toFixed(2)}
      </td>

      <td className="px-2 py-1.5 text-right">{item.disc}%</td>

      <td className="px-2 py-1.5 text-right font-semibold text-gray-800">
        {item.mrp.toFixed(2)}
      </td>
    </tr>
  );
};

export default ProductRow;

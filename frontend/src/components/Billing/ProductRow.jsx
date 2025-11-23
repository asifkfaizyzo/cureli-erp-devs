const ProductRow = ({ index, item }) => {
  return (
    <tr
      className={`
        text-[11px] text-gray-700
        ${index % 2 === 0 ? "bg-[#F5F6FA]" : "bg-[#F5F6FA]"}
        hover:bg-gray-100
        border-b-4 border-white
        transition
      `}
    >
      <td className="px-2 py-2 border-4 border-white rounded-xl text-center w-8">{index + 1}</td>
      <td className="px-2 py-2 border-4 border-white rounded-xl">{item.name}</td>
      <td className="px-2 py-2 border-4 border-white rounded-xl text-center">{item.batch}</td>

      <td className="px-2 py-2 border-4 border-white rounded-xl text-right">
        {item.rate.toFixed(2)}
      </td>

      <td className="px-2 py-2 border-4 border-white rounded-xl text-center">{item.qty}</td>
      <td className="px-2 py-2 border-4 border-white rounded-xl text-center">{item.exp}</td>
      <td className="px-2 py-2 border-4 border-white rounded-xl text-center">{item.type}</td>
      <td className="px-2 py-2 border-4 border-white rounded-xl text-center">{item.category}</td>
      <td className="px-2 py-2 border-4 border-white rounded-xl text-center">{item.stock}</td>
      <td className="px-2 py-2 border-4 border-white rounded-xl text-center">{item.rack}</td>

      <td className="px-2 py-2 border-4 border-white rounded-xl text-right">{item.tax}%</td>

      <td className="px-2 py-2 border-4 border-white rounded-xl text-right">
        {item.taxAmt.toFixed(2)}
      </td>

      <td className="px-2 py-2 border-4 border-white rounded-xl text-right">{item.disc}%</td>
      <td className="px-2 py-2 border-4 border-white rounded-xl text-right font-semibold text-gray-800">
        {item.mrp.toFixed(2)}
      </td>
    </tr>
  );
};

export default ProductRow;

// eslint-disable-next-line react/prop-types
export const Balance = ({ value }) => {
  const formatCurrency = (amount) => {
    const numValue = parseFloat(amount) || 0;
    return `$${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="flex pt-4 pl-9">
      <div className="font-bold text-lg">Your balance</div>
      <div className="font-semibold ml-4 text-lg">{formatCurrency(value)}</div>
    </div>
  );
};

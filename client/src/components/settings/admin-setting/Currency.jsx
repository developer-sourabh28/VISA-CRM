import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BackButton from '@/components/BackButton';

const currencyNames = {
  INR: "Indian Rupee",
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  AUD: "Australian Dollar",
  CAD: "Canadian Dollar",
  JPY: "Japanese Yen",
  CHF: "Swiss Franc",
  CNY: "Chinese Yuan",
  // Add more as needed
};

function CurrencyConverter() {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(1);
  const [fromCurrency, setFromCurrency] = useState('INR');
  const [toCurrency, setToCurrency] = useState('USD');
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [rates, setRates] = useState({});
  const [pinnedCurrencies, setPinnedCurrencies] = useState([]);

  useEffect(() => {
    // Fetch currency rates
    axios.get('https://api.frankfurter.app/latest?from=INR')
      .then(res => setRates(res.data.rates))
      .catch(err => console.error('Error fetching rates:', err));

    // Fetch pinned currencies from backend
    axios.get('/api/currencies')
      .then(res => setPinnedCurrencies(res.data))
      .catch(err => console.error('Error fetching pinned currencies:', err));
  }, []);

  const handleConvert = () => {
    if (fromCurrency === toCurrency) {
      setConvertedAmount(amount);
      return;
    }

    axios
      .get(`https://api.frankfurter.app/latest?amount=${amount}&from=${fromCurrency}&to=${toCurrency}`)
      .then(res => setConvertedAmount(res.data.rates[toCurrency]))
      .catch(err => console.error('Conversion error:', err));
  };

  const handleAddPinned = async () => {
    if (convertedAmount === null) return;

    const label = `${amount} ${fromCurrency} → ${toCurrency}`;
    const entry = {
      label,
      value: `${convertedAmount.toFixed(2)} ${toCurrency}`,
      amount,
      fromCurrency,
      toCurrency,
      convertedAmount: convertedAmount.toFixed(2),
      date: new Date().toISOString(),
    };

    setPinnedCurrencies((prev) => [...prev, entry]);

    // Save to backend
    try {
      await axios.post('/api/currencies', entry);
      // Optionally show a success message here
    } catch (err) {
      alert('Failed to save conversion');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this conversion?")) return;
    try {
      await axios.delete(`/api/currencies/${id}`);
      setPinnedCurrencies((prev) => prev.filter((currency) => currency._id !== id));
    } catch (err) {
      alert("Failed to delete conversion");
    }
  };

  return (
    <div className="p-4">
      <BackButton />
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white px-4 py-2 rounded-md"
      >
        {isOpen ? 'Close Converter' : 'Open Currency Converter'}
      </button>

      {/* Pinned Currency List */}
      {pinnedCurrencies.length > 0 && (
        <div className="mt-4 bg-gray-100 p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-2">Pinned Conversions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left border">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 border">Label</th>
                  <th className="px-4 py-2 border">Value</th>
                  <th className="px-4 py-2 border">From</th>
                  <th className="px-4 py-2 border">To</th>
                  <th className="px-4 py-2 border">Date</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pinnedCurrencies.map((pin) => (
                  <tr key={pin._id} className="border-b">
                    <td className="px-4 py-2 border">{pin.label}</td>
                    <td className="px-4 py-2 border font-semibold">{pin.value}</td>
                    <td className="px-4 py-2 border">
                      {pin.fromCurrency} ({currencyNames[pin.fromCurrency] || pin.fromCurrency})
                    </td>
                    <td className="px-4 py-2 border">
                      {pin.toCurrency} ({currencyNames[pin.toCurrency] || pin.toCurrency})
                    </td>
                    <td className="px-4 py-2 border">{pin.date ? new Date(pin.date).toLocaleString() : ''}</td>
                    <td className="px-4 py-2 border">
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700"
                        onClick={() => handleDelete(pin._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Converter Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4">Currency Converter</h2>
            <div className="space-y-3">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="border px-3 py-2 rounded w-full"
              />
              <div className="flex gap-4">
                <select
                  value={fromCurrency}
                  onChange={e => setFromCurrency(e.target.value)}
                  className="border px-3 py-2 rounded w-1/2"
                >
                  <option value="INR">INR - {currencyNames["INR"]}</option>
                  {Object.keys(rates).map((cur) => (
                    <option key={cur} value={cur}>
                      {cur} - {currencyNames[cur] || cur}
                    </option>
                  ))}
                </select>
                <select
                  value={toCurrency}
                  onChange={e => setToCurrency(e.target.value)}
                  className="border px-3 py-2 rounded w-1/2"
                >
                  <option value="USD">USD - {currencyNames["USD"]}</option>
                  {Object.keys(rates).map((cur) => (
                    <option key={cur} value={cur}>
                      {cur} - {currencyNames[cur] || cur}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleConvert}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Convert
              </button>

              {convertedAmount !== null && (
                <div className="mt-2 text-sm text-green-800 font-semibold">
                  {amount} {fromCurrency} = {convertedAmount.toFixed(2)} {toCurrency}
                </div>
              )}

              <button
                onClick={handleAddPinned}
                disabled={convertedAmount === null}
                className="mt-2 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                Add to Pinned
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CurrencyConverter;

function App() {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-bold text-white mb-6 tracking-wide">
          ♟ Шахматная доска
        </h1>

        <div className="flex items-center">
          {/* Цифры слева (1-8) */}
          <div className="flex flex-col mr-2">
            {ranks.map((rank) => (
              <div
                key={rank}
                className="flex items-center justify-center text-gray-300 font-semibold text-sm sm:text-base"
                style={{ width: '2rem', height: '4rem' }}
              >
                {rank}
              </div>
            ))}
          </div>

          {/* Доска */}
          <div className="border-4 border-amber-900 rounded shadow-2xl">
            {ranks.map((rank, rowIndex) => (
              <div key={rank} className="flex">
                {files.map((file, colIndex) => {
                  const isLight = (rowIndex + colIndex) % 2 === 0;
                  return (
                    <div
                      key={`${file}${rank}`}
                      className={`
                        w-12 h-12 sm:w-16 sm:h-16
                        flex items-center justify-center
                        transition-colors duration-150
                        ${isLight ? 'bg-amber-100' : 'bg-amber-800'}
                      `}
                    >
                      {/* Клетка пустая — просто цвет */}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Цифры справа (1-8) */}
          <div className="flex flex-col ml-2">
            {ranks.map((rank) => (
              <div
                key={rank}
                className="flex items-center justify-center text-gray-300 font-semibold text-sm sm:text-base"
                style={{ width: '2rem', height: '4rem' }}
              >
                {rank}
              </div>
            ))}
          </div>
        </div>

        {/* Буквы снизу (a-h) */}
        <div className="flex mt-2 ml-10">
          {files.map((file) => (
            <div
              key={file}
              className="flex items-center justify-center text-gray-300 font-semibold text-sm sm:text-base"
              style={{ width: '4rem', height: '2rem' }}
            >
              {file}
            </div>
          ))}
        </div>

        {/* Подпись */}
        <p className="text-gray-500 text-sm mt-6">
          Пустая доска с маркировкой a–h, 1–8
        </p>
      </div>
    </div>
  );
}

export default App;

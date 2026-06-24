var fso = new ActiveXObject("Scripting.FileSystemObject");
var path = "C:\\Users\\sanyo\\.gemini\\antigravity\\scratch\\chess-game\\items-db.js";
var file = fso.OpenTextFile(path, 1);
var txt = file.ReadAll();
file.Close();

// Simple translation logic
txt = txt.replace(/name:\s*'Сапоги скорости',/g, "name: { ru: 'Сапоги скорости', en: 'Boots of Speed', es: 'Botas de Velocidad' },");
txt = txt.replace(/description:\s*'Скользящие фигуры \(ладья, слон, ферзь\) получают \+1 к дальности хода\.',/g, "description: { ru: 'Скользящие фигуры (ладья, слон, ферзь) получают +1 к дальности хода.', en: 'Sliding pieces (rook, bishop, queen) gain +1 move range.', es: 'Las piezas deslizantes (torre, alfil, reina) ganan +1 de alcance.' },");

txt = txt.replace(/name:\s*'Компас',/g, "name: { ru: 'Компас', en: 'Compass', es: 'Brújula' },");
txt = txt.replace(/description:\s*'Слон может дополнительно ходить на 1 клетку по прямой\.',/g, "description: { ru: 'Слон может дополнительно ходить на 1 клетку по прямой.', en: 'Bishop can optionally move 1 square straight.', es: 'El alfil puede opcionalmente moverse 1 casilla recto.' },");

// write back
var fileOut = fso.OpenTextFile(path + ".new", 2, true);
fileOut.Write(txt);
fileOut.Close();

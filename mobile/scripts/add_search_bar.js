const fs = require('fs');
let code = fs.readFileSync('C:/projects/food-scanner/mobile/src/app/recipes.tsx', 'utf8');

// Add Search and TextInput imports
code = code.replace(/import \{ View, Text, FlatList, TouchableOpacity, ActivityIndicator \} from 'react-native';/, "import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';");
code = code.replace(/import \{ ArrowLeft, Clock \} from 'lucide-react-native';/, "import { ArrowLeft, Clock, Search } from 'lucide-react-native';");

// Add state
code = code.replace(/const \[loading, setLoading\] = useState\(true\);/, `const [loading, setLoading] = useState(true);\n  const [searchQuery, setSearchQuery] = useState('');`);

// Add filtered recipes
code = code.replace(/data={recipes}/, 'data={recipes.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || (r.name_tagalog && r.name_tagalog.toLowerCase().includes(searchQuery.toLowerCase())))}');

// Update recipe count
code = code.replace(/\{recipes.length\} recipes available/, `{recipes.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || (r.name_tagalog && r.name_tagalog.toLowerCase().includes(searchQuery.toLowerCase()))).length} recipes available`);

// Insert Search Bar after Header
code = code.replace(/<\/View>\s*\{\/\* Content \*\/\}/, `</View>\n\n      {/* Search Bar */}\n      <View className="px-6 py-3 border-b border-orange-50 bg-white">\n        <View className="flex-row items-center bg-stone-100 rounded-xl px-4 py-3">\n          <Search size={18} color="#9ca3af" />\n          <TextInput\n            className="flex-1 ml-3 text-base text-stone-800"\n            placeholder="Search for a recipe..."\n            placeholderTextColor="#9ca3af"\n            value={searchQuery}\n            onChangeText={setSearchQuery}\n          />\n        </View>\n      </View>\n\n      {/* Content */}`);

fs.writeFileSync('C:/projects/food-scanner/mobile/src/app/recipes.tsx', code);

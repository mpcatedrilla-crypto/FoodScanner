import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Star, ChefHat, User, Key, Heart, Bookmark, FileText, Info, HelpCircle, LogOut } from 'lucide-react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
  const { session } = useAuth();
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  // Profile state
  const [stats, setStats] = useState({ scans_completed: 0, recipes_saved: 0, contributions: 0, full_name: 'Chef', avatar_url: '' });
  
  // Edit State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (session?.user) {
      fetchOrCreateProfile();
    }
  }, [session]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64 && session?.user?.id) {
      setLoading(true);
      try {
        const ext = result.assets[0].uri.split('.').pop() || 'jpg';
        const fileName = `${session.user.id}_${Date.now()}.${ext}`;
        
        // Decode base64 to ArrayBuffer for Supabase Storage
        const arrayBuffer = decode(result.assets[0].base64);

        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, arrayBuffer, { contentType: 'image/' + ext });

        if (error) {
          Alert.alert('Upload Failed', error.message + '\n\nPlease ensure you run the SQL policy from the prompt.');
        } else {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
          await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
          setStats(s => ({ ...s, avatar_url: publicUrl }));
        }
      } catch (err: any) {
        Alert.alert('Error', err.message);
      }
      setLoading(false);
    }
  };

  const updateName = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    // Use Supabase Auth metadata instead of custom table to avoid SQL changes!
    const { error } = await supabase.auth.updateUser({ data: { full_name: newName } });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setStats(s => ({ ...s, full_name: newName }));
      setShowNameModal(false);
    }
  };

  const updatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      Alert.alert('Error updating password', error.message);
    } else {
      Alert.alert('Success', 'Password updated successfully!');
      setShowPasswordModal(false);
      setNewPassword('');
    }
  };

  const fetchOrCreateProfile = async () => {
    // Get full name from auth metadata
    const { data: authData } = await supabase.auth.getUser();
    const currentName = authData.user?.user_metadata?.full_name || 'Chef';
    const currentAvatar = authData.user?.user_metadata?.avatar_url || '';

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session!.user.id)
      .single();

    if (data) {
      setStats({
        scans_completed: data.scans_completed || 0,
        recipes_saved: data.recipes_saved || 0,
        contributions: data.contributions || 0,
        full_name: currentName,
        avatar_url: currentAvatar
      });
      setNewName(currentName);
    } else {
      await supabase.from('profiles').insert({
        id: session!.user.id,
        email: session!.user.email,
        scans_completed: 0,
        recipes_saved: 0,
        contributions: 0
      });
      setStats(s => ({ ...s, full_name: currentName, avatar_url: currentAvatar }));
      setNewName(currentName);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Login Failed', error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert('Registration Failed', error.message);
    setLoading(false);
  }

  const CardButton = ({ icon: Icon, title, image, fullWidth = false, onPress = () => {} }: any) => (
    <TouchableOpacity 
      className={`bg-[#1c1c1e] rounded-2xl p-4 flex-row items-center border border-white/5 mb-4 ${fullWidth ? 'w-full' : 'w-[48%]'}`}
      onPress={onPress}
    >
      <View className="w-10 h-10 rounded-full bg-[#0fa958]/10 items-center justify-center mr-3 border border-[#0fa958]/20">
        <Icon size={20} color="#0fa958" />
      </View>
      <View className="flex-1 justify-center">
        <Text className="text-white font-medium text-sm">{title}</Text>
        {image && <Text className="text-gray-400 text-[10px] mt-0.5 leading-tight">Manage your curated collections</Text>}
      </View>
      {image && <Image source={{ uri: 'https://placehold.co/600x400/0fa958/ffffff.png?text=Recipe' }} style={{ width: 40, height: 40, borderRadius: 8, marginLeft: 8 }} />}
      {!image && <Text className="text-[#0fa958] font-bold text-lg ml-2">&gt;</Text>}
    </TouchableOpacity>
  );

  if (!session) {
    return (
      <View className="flex-1 bg-[#09090b]">
        <View className="flex-1 px-6 justify-center">
          <View className="items-center mb-10">
            <View className="w-20 h-20 bg-[#0fa958]/20 rounded-full items-center justify-center mb-4 border-2 border-[#0fa958]/30">
              <ChefHat size={40} color="#0fa958" />
            </View>
            <Text className="text-white text-3xl font-extrabold text-center">FoodScanner</Text>
            <Text className="text-gray-400 mt-2 text-center">Login to sync your recipes and stats.</Text>
          </View>
          <View className="bg-[#1c1c1e] p-6 rounded-3xl border border-white/5">
            <Text className="text-white text-xl font-bold mb-6">{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
            <TextInput
              className="bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white mb-4"
              placeholder="Email address"
              placeholderTextColor="#71717a"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              className="bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white mb-6"
              placeholder="Password"
              placeholderTextColor="#71717a"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              className="bg-[#0fa958] rounded-full py-4 items-center justify-center mb-4"
              onPress={isLogin ? signInWithEmail : signUpWithEmail}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">{isLogin ? 'Log In' : 'Sign Up'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text className="text-[#0fa958] text-center font-medium">
                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#09090b]">
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#0fa958" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold tracking-widest text-center flex-1 pr-6">USER PROFILE</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-4 pb-[100px]" showsVerticalScrollIndicator={false}>
        <View className="bg-[#1c1c1e] rounded-[24px] overflow-hidden mb-8 border border-white/5">
          <View className="h-24 w-full" />
          <View className="items-center px-4 pb-6 relative -mt-12">
            <TouchableOpacity 
              onPress={pickImage} 
              disabled={loading}
              className="w-24 h-24 rounded-full border-4 border-[#09090b] bg-gray-800 overflow-hidden items-center justify-center mb-3"
            >
               {stats.avatar_url ? (
                 <Image source={{ uri: stats.avatar_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
               ) : (
                 <User size={40} color="white" />
               )}
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">{stats.full_name}</Text>
            <Text className="text-gray-400 text-sm">{session.user.email}</Text>
          </View>
        </View>

        <Text className="text-white font-bold tracking-wider mb-3">ACCOUNT & SECURITY</Text>
        <View className="flex-row justify-between w-full">
          <CardButton icon={User} title="Personal Details" onPress={() => setShowNameModal(true)} />
          <CardButton icon={Key} title="Change Password" onPress={() => setShowPasswordModal(true)} />
        </View>

        <Text className="text-white font-bold tracking-wider mb-3 mt-4">SUPPORT & LEGAL</Text>
        <View className="flex-row justify-between w-full">
          <CardButton icon={FileText} title="Terms of Service" onPress={() => router.push('/terms')} />
          <CardButton icon={Info} title="About us" onPress={() => router.push('/about')} />
        </View>
        <View className="flex-row justify-between w-full pb-8">
          <CardButton icon={HelpCircle} title="Help Center" onPress={() => router.push('/help')} />
          <CardButton icon={LogOut} title="Logout" onPress={handleLogout} />
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center px-6">
          <View className="bg-[#1c1c1e] p-6 rounded-2xl border border-white/10">
            <Text className="text-white text-lg font-bold mb-4">Edit Name</Text>
            <TextInput 
              className="bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white mb-6"
              value={newName} onChangeText={setNewName} placeholder="Your name" placeholderTextColor="#71717a"
            />
            <View className="flex-row justify-end space-x-4">
              <TouchableOpacity onPress={() => setShowNameModal(false)} className="py-3 px-6"><Text className="text-gray-400">Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={updateName} disabled={loading} className="bg-[#0fa958] py-3 px-6 rounded-xl">
                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center px-6">
          <View className="bg-[#1c1c1e] p-6 rounded-2xl border border-white/10">
            <Text className="text-white text-lg font-bold mb-4">New Password</Text>
            <TextInput 
              className="bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white mb-6"
              secureTextEntry value={newPassword} onChangeText={setNewPassword} placeholder="Min 6 characters" placeholderTextColor="#71717a"
            />
            <View className="flex-row justify-end space-x-4">
              <TouchableOpacity onPress={() => setShowPasswordModal(false)} className="py-3 px-6"><Text className="text-gray-400">Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={updatePassword} disabled={loading} className="bg-[#0fa958] py-3 px-6 rounded-xl">
                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

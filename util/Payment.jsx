import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Linking
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { Buffer } from 'buffer';
if (!global.Buffer) global.Buffer = Buffer;   // make it available everywhere

export default function Payment({ visible, onClose, recipient = 'Bob' }) {

  /* ---------- local state ---------- */
  const preset        = [1, 5, 10, 20];
  const [selected, setSelected] = useState(null);
  const [custom,   setCustom]   = useState('');
  const amount = selected ?? (parseFloat(custom) || 0);

const CLIENT_ID     = 'AfVjEL9xbNAbV_nFXwjKr6TBrqAMHnIwNNJOGoArw6jyBu-sa4u9nwkprUDegwSoN4gKfi6Vx7YPiKFu';
const CLIENT_SECRET = 'EMzH9BQ4K_08AVGBqTBWBsuwDJvHzcuX8OzyFHTD1hsV5FlhcaY-SciObKm0uYEkObEtCDTp2ldNpyb8';
const BASE          = 'https://api-m.sandbox.paypal.com';   // live ⇒ api-m.paypal.com

/* helper: basic-auth header */
const basicAuth = () =>
  'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

async function handlePay() {
  if (amount <= 0) { alert('Enter an amount'); return; }
  console.log(typeof Buffer);

  /* 1️⃣  OAuth2 token */
  const { access_token } = await fetch(`${BASE}/v1/oauth2/token`, {
    method : 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization : basicAuth(),
    },
    body   : 'grant_type=client_credentials',
  }).then(r => r.json());

  /* 2️⃣  create order */
  const order = await fetch(`${BASE}/v2/checkout/orders`, {
    method : 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization : `Bearer ${access_token}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        { amount: { currency_code: 'USD', value: amount.toFixed(2) } },
      ],
      application_context: {
        return_url: 'myapp://paypal-success',
        cancel_url: 'myapp://paypal-cancel',
      },
    }),
  }).then(r => r.json());

  /* 3️⃣  open the approval link */
  const approveURL =
    order.links.find(l => l.rel === 'approve')?.href ||
    `https://www.paypal.com/checkoutnow?token=${order.id}`;

  await Linking.openURL(approveURL);
}

  /* ---------- UI ---------- */
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.close} onPress={onClose}>
            <AntDesign name="close" size={22} />
          </TouchableOpacity>
          <Text style={styles.title}>Tip {recipient}</Text>
            <ScrollView contentContainerStyle={styles.body}>
              {/* preset pills */}
              <View style={styles.row}>
                {preset.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.pill, selected === p && styles.pillSelected]}
                    onPress={() => { setSelected(p); setCustom(''); }}
                  >
                    <Text>${p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* custom input */}
              <View style={styles.inputRow}>
                <Text>$</Text>
                <TextInput
                  style={styles.input}
                  value={custom}
                  onChangeText={t => { setCustom(t); setSelected(null); }}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
              </View>

              {/* Pay $X */}
              <TouchableOpacity
                style={[
                  styles.pay,
                  amount > 0 ? styles.payEnabled : styles.payDisabled,
                ]}
                disabled={amount <= 0}
                onPress={handlePay}
              >
                <Text style={styles.payText}>Pay ${amount.toFixed(2)}</Text>
              </TouchableOpacity>
            </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ---------- minimal styling ---------- */
const styles = StyleSheet.create({
  overlay:{flex:1,justifyContent:'center',alignItems:'center'},
  card:{width:'88%',padding:20,backgroundColor:'#fff',borderRadius:12,flex:1},
  close:{position:'absolute',top:10,right:10},
  title:{fontSize:18,fontWeight:'600',marginBottom:20},
  row:{flexDirection:'row',flexWrap:'wrap',marginBottom:20},
  pill:{borderWidth:1,borderColor:'#888',borderRadius:18,
        paddingVertical:6,paddingHorizontal:14,margin:4},
  pillSelected:{backgroundColor:'#eee'},
  inputRow:{flexDirection:'row',alignItems:'center',
            borderWidth:1,borderColor:'#888',borderRadius:8,
            padding:8,marginBottom:20},
  input:{flex:1,height:36},
  pay:{padding:14,borderRadius:8,alignItems:'center'},
  payEnabled:{backgroundColor:'#333'},
  payDisabled:{backgroundColor:'#bbb'},
  payText:{color:'#fff',fontWeight:'600'},
  body:{paddingBottom:40},
});

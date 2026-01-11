import React, { useEffect, useState, useMemo } from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';

const COLORS = ['#1f2937','#ff6b00','#f59e0b','#10b981','#8b5cf6'];

export default function AdminReports(){
  const [merchants,setMerchants]=useState([]);
  const [offers,setOffers]=useState([]);
  const [customers,setCustomers]=useState([]);

  useEffect(()=>{ const u1=onSnapshot(collection(db,'merchants'),snap=>setMerchants(snap.docs.map(d=>({id:d.id,...d.data()})))); const u2=onSnapshot(collection(db,'offers'),snap=>setOffers(snap.docs.map(d=>({id:d.id,...d.data()})))); const u3=onSnapshot(collection(db,'customers'),snap=>setCustomers(snap.docs.map(d=>({id:d.id,...d.data()})))); return ()=>{u1();u2();u3();}; },[]);

  const merchantsByCategory = useMemo(()=>{ const map={}; merchants.forEach(m=>map[m.category]= (map[m.category]||0)+1); return Object.entries(map).map(([id,value])=>({ id, label:id, value })); },[merchants]);
  const offersByCategory = useMemo(()=>{ const map={}; offers.forEach(o=>map[o.category]= (map[o.category]||0)+1); return Object.entries(map).map(([id,value])=>({ category:id, value })); },[offers]);
  const merchantStatus = useMemo(()=>{ const approved=merchants.filter(m=>m.status==='approved').length; const pending=merchants.filter(m=>m.status==='pending').length; const rejected=merchants.filter(m=>m.status==='rejected').length; return [{status:'Approved',count:approved},{status:'Pending',count:pending},{status:'Rejected',count:rejected}]; },[merchants]);
  const offersActiveExpired = useMemo(()=>{ const now=new Date(); const active=offers.filter(o=>!o.expiryDate || new Date(o.expiryDate)>=now).length; const expired=offers.length-active; return [{ id:'active', label:'Active', value:active },{ id:'expired', label:'Expired', value:expired }]; },[offers]);

  return (
    <Box>
      <Typography variant="h6" sx={{mb:2}}>Admin Reports</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{p:2}}>
            <Typography>Merchants by Category</Typography>
            <div style={{height:300}}>
              <ResponsivePie data={merchantsByCategory} margin={{top:40,right:80,bottom:80,left:80}} colors={{ scheme: 'nivo' }} />
            </div>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{p:2}}>
            <Typography>Offers by Category</Typography>
            <div style={{height:300}}>
              <ResponsiveBar data={offersByCategory} keys={['value']} indexBy="category" margin={{top:20,right:20,bottom:60,left:60}} />
            </div>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{p:2}}>
            <Typography>Merchant Status</Typography>
            <div style={{height:260}}>
              <ResponsiveBar data={merchantStatus.map(m=>({status:m.status,count:m.count}))} keys={['count']} indexBy="status" margin={{top:20,right:20,bottom:60,left:60}} />
            </div>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{p:2}}>
            <Typography>Offers: Active vs Expired</Typography>
            <div style={{height:260}}>
              <ResponsivePie data={offersActiveExpired} margin={{top:40,right:80,bottom:80,left:80}} />
            </div>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

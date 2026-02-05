/**
 * 🔒 LOCKED AFTER PHASE 2.6
 * Admin approval flow stable
 */

import React,{useEffect,useState} from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material';
import { db } from '../../firebase';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { sendNotification } from '../../utils/sendNotification';

export default function PendingApprovals(){
  const [pending,setPending]=useState([]);
  useEffect(()=>{const unsub=onSnapshot(collection(db,'merchants'),snap=>setPending(snap.docs.map(d=>({id:d.id,...d.data()})).filter(m=>m.status==='pending')));return ()=>unsub();},[]);
  const approve=async(m)=>{ if(!confirm('Approve merchant?')) return; await updateDoc(doc(db,'merchants',m.id),{status:'approved'}); try{ await sendNotification(`merchant_${m.mobile}`,'merchant','Approved','Your account approved'); }catch(e){} };
  const reject=async(m)=>{ if(!confirm('Reject merchant?')) return; await updateDoc(doc(db,'merchants',m.id),{status:'rejected'}); try{ await sendNotification(`merchant_${m.mobile}`,'merchant','Rejected','Your registration rejected'); }catch(e){} };

  return (
    <Box>
      <Typography variant='h6'>Pending Approvals</Typography>
      <Paper sx={{mt:2}}>
        <Table>
          <TableHead><TableRow><TableCell>Shop</TableCell><TableCell>Category</TableCell><TableCell>Mobile</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {pending.map(m=> <TableRow key={m.id}><TableCell>{m.shopName}</TableCell><TableCell>{m.category}</TableCell><TableCell>{m.mobile}</TableCell>
              <TableCell><Button onClick={()=>approve(m)}>Approve</Button><Button color='error' onClick={()=>reject(m)}>Reject</Button></TableCell></TableRow>)}
            {pending.length===0 && <TableRow><TableCell colSpan={4} align='center'>No pending</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

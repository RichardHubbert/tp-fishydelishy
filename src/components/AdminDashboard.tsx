import React, { useState, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
import { Calendar, Users, Clock, MapPin, Phone, Mail, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { fetchTables, fetchAllBookings, getNextReservationForTable, type Table as TableType, type Booking, updateBooking, deleteBooking, createTable, updateTable, deleteTable, placeBooking } from '@/services/supabaseBookingService';
import { useAdmin } from '@/hooks/useAdmin';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { fetchRestaurants, Restaurant } from '@/services/restaurantService';
import DashboardRestaurants from '@/components/DashboardRestaurants';
import BookingTimeline from '@/components/BookingTimeline';
import BookingModal from '@/components/BookingModal';

const AdminDashboard = () => {
  const { isAdmin } = useAdmin();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tables, setTables] = useState<TableType[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [deletingBooking, setDeletingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState<Partial<Booking>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [emailTestResult, setEmailTestResult] = useState<string | null>(null);
  const [tableDialog, setTableDialog] = useState<TableType | 'add' | null>(null);
  const [deletingTable, setDeletingTable] = useState<TableType | null>(null);
  const [tableForm, setTableForm] = useState({ name: '', capacity: 2, section: '' });
  const [tableError, setTableError] = useState<string | null>(null);
  const [tableActionLoading, setTableActionLoading] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Loading admin dashboard data...');
        const [tablesData, bookingsData, restaurantsData] = await Promise.all([
          fetchTables(),
          fetchAllBookings(),
          fetchRestaurants()
        ]);
        console.log('Tables loaded:', tablesData);
        console.log('Bookings loaded:', bookingsData);
        console.log('Restaurants loaded:', restaurantsData);
        setTables(tablesData);
        setAllBookings(bookingsData);
        setRestaurants(restaurantsData);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getFilteredBookings = () => {
    if (!selectedRestaurant) return allBookings;
    return allBookings.filter(booking => booking.restaurant_id === selectedRestaurant);
  };

  // Get bookings for selected date
  const dayBookings = getFilteredBookings().filter(booking => 
    isSameDay(new Date(booking.booking_date), selectedDate)
  );

  // Get table status for selected date
  const getTableStatus = (table: TableType) => {
    const tableBookings = dayBookings.filter(booking => booking.table_id === table.id);
    return tableBookings;
  };

  const handleAddTableClick = () => {
    setTableForm({ name: '', capacity: 2, section: '' });
    setTableError(null);
    setTableDialog('add');
  };
  const handleEditTableClick = (table: TableType) => {
    setTableForm({ name: table.name, capacity: table.capacity, section: table.section });
    setTableError(null);
    setTableDialog(table);
  };
  const handleTableFormChange = (field: 'name' | 'section', value: string) => {
    setTableForm(form => ({ ...form, [field]: value }));
  };
  const handleTableSave = async () => {
    const name = tableForm.name.trim();
    const section = tableForm.section.trim();
    const capacity = Number(tableForm.capacity);

    if (!name || !section) {
      setTableError('Name and section are required.');
      return;
    }
    if (!Number.isInteger(capacity) || capacity < 1) {
      setTableError('Capacity must be at least 1.');
      return;
    }

    setTableActionLoading(true);
    setTableError(null);
    try {
      if (tableDialog === 'add') {
        await createTable({ name, capacity, section });
      } else if (tableDialog) {
        await updateTable(tableDialog.id, { name, capacity, section });
      }
      setTables(await fetchTables());
      setTableDialog(null);
    } catch (err) {
      setTableError(err instanceof Error ? err.message : 'Failed to save table.');
    } finally {
      setTableActionLoading(false);
    }
  };
  const handleDeleteTableConfirm = async () => {
    if (!deletingTable) return;
    setTableActionLoading(true);
    setTableError(null);
    try {
      await deleteTable(deletingTable.id);
      const [tablesData, bookingsData] = await Promise.all([
        fetchTables(),
        fetchAllBookings(),
      ]);
      setTables(tablesData);
      setAllBookings(bookingsData);
      setDeletingTable(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete table.';
      setTableError(
        message.toLowerCase().includes('foreign key')
          ? 'Could not delete this table because its bookings are still there. Sign in and try again.'
          : message
      );
    } finally {
      setTableActionLoading(false);
    }
  };

  const handleEditClick = (booking: Booking) => {
    setEditingBooking(booking);
    setEditForm({ ...booking });
  };
  const handleDeleteClick = (booking: Booking) => {
    setDeletingBooking(booking);
  };
  const handleEditChange = (field: keyof Booking, value: any) => {
    setEditForm(f => ({ ...f, [field]: value }));
  };
  const handleEditSave = async () => {
    if (editingBooking) {
      setActionLoading(true);
      setEditError(null);
      try {
        console.log('Attempting to update booking with ID:', editingBooking.id);
        console.log('Update data:', editForm);
        // Filter out the restaurant object and only update actual database fields
        const { restaurant, ...updateData } = editForm;
        console.log('Filtered update data:', updateData);
        await updateBooking(editingBooking.id, updateData);
        const bookingsData = await fetchAllBookings();
        setAllBookings(bookingsData);
        setEditingBooking(null);
        console.log('Booking updated successfully');
      } catch (err: any) {
        console.error('Failed to update booking', err);
        setEditError(err?.message || 'Failed to update booking. Check console for details.');
      } finally {
        setActionLoading(false);
      }
    }
  };
  const handleDeleteConfirm = async () => {
    if (deletingBooking) {
      setActionLoading(true);
      setDeleteError(null);
      try {
        console.log('Attempting to delete booking with ID:', deletingBooking.id);
        await deleteBooking(deletingBooking.id);
        const bookingsData = await fetchAllBookings();
        setAllBookings(bookingsData);
        setDeletingBooking(null);
      } catch (err: any) {
        console.error('Failed to delete booking', err);
        setDeleteError(err?.message || 'Failed to delete booking. Check RLS or Supabase logs.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const refreshBookings = async () => {
    const bookingsData = await fetchAllBookings();
    setAllBookings(bookingsData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6 p-4">
        {/* Date Selector */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-700">Bookings Overview</h2>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 border rounded-lg p-3 bg-white shadow-sm">
                <Calendar className="h-5 w-5 text-gray-500" />
                <input
                  type="date"
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="border-none focus:ring-0 p-0 text-gray-800"
                />
              </div>
              
              <div className="rounded-full bg-amber-50 border border-amber-100 py-2 px-4">
                <span className="text-amber-800 font-medium">
                  {format(selectedDate, 'EEEE, MMMM do, yyyy')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Tables</p>
                    <p className="text-2xl font-bold">{tables.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Booked Tables</p>
                    <p className="text-2xl font-bold">{dayBookings.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Available Tables</p>
                    <p className="text-2xl font-bold">{tables.length - dayBookings.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Guests</p>
                    <p className="text-2xl font-bold">
                      {dayBookings.reduce((sum, booking) => sum + booking.party_size, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <BookingTimeline
          date={selectedDate}
          onDateChange={setSelectedDate}
          tables={tables}
          bookings={dayBookings}
          schedule={allBookings}
          restaurants={restaurants}
          selectedRestaurantId={selectedRestaurant}
          onRestaurantChange={setSelectedRestaurant}
          onNewBooking={() => setIsBookingModalOpen(true)}
          onMoveBooking={async (booking, update) => {
            await updateBooking(booking.id, {
              table_id: update.tableId,
              start_time: update.startTime,
              end_time: update.endTime,
            });
            await refreshBookings();
          }}
          onSaveBooking={async (booking, update) => {
            await updateBooking(booking.id, update);
            await refreshBookings();
          }}
          onAcceptRequest={async (request, slot) => {
            const [hours, minutes] = slot.time.split(':').map(Number);
            const endTotal = hours * 60 + minutes + request.duration_minutes;
            const endTime = `${String(Math.floor(endTotal / 60)).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}:00`;
            await placeBooking({
              restaurantId: request.restaurant_id || selectedRestaurant || restaurants[0]?.id,
              tableId: slot.tableId,
              date: request.booking_date,
              startTime: `${slot.time}:00`,
              endTime,
              partySize: request.party_size,
              customerName: request.customer_name,
              customerEmail: request.customer_email,
              customerPhone: request.customer_phone,
              specialRequests: request.notes,
            });
            await refreshBookings();
          }}
        />

        {/* Tables Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Table Status Overview</CardTitle>
                  <CardDescription>Current status of all tables for {format(selectedDate, 'MMM do, yyyy')}</CardDescription>
                </div>
                <Button size="sm" onClick={handleAddTableClick}>Add table</Button>
              </div>
            </CardHeader>
            <CardContent>
              {tables.length === 0 ? (
                <p className="text-sm text-gray-500">No tables yet. Add one to start taking bookings.</p>
              ) : null}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tables.map(table => {
                  const bookings = getTableStatus(table);
                  const isBooked = bookings.length > 0;
                  const nextReservation = getNextReservationForTable(table.id, allBookings);
                  
                  return (
                    <div
                      key={table.id}
                      className={`p-4 rounded-lg border-2 ${
                        isBooked 
                          ? 'border-red-200 bg-red-50' 
                          : 'border-green-200 bg-green-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{table.name}</h3>
                        <Badge variant={isBooked ? 'destructive' : 'default'}>
                          {isBooked ? 'Booked' : 'Available'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>Capacity: {table.capacity}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>Section: {table.section}</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" variant="secondary" onClick={() => handleEditTableClick(table)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => { setTableError(null); setDeletingTable(table); }}>Delete</Button>
                        </div>
                        
                        {/* Next Reservation Info */}
                        {nextReservation && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                            <p className="font-medium text-xs text-blue-800">Next Reservation:</p>
                            <p className="text-xs text-blue-700">
                              {format(new Date(nextReservation.booking_date), 'MMM dd')} at {nextReservation.start_time}
                            </p>
                            <p className="text-xs text-blue-600">{nextReservation.customer_name}</p>
                          </div>
                        )}
                        
                        {bookings.map(booking => (
                          <div key={booking.id} className="mt-2 p-2 bg-white rounded border">
                            <p className="font-medium text-xs">{booking.customer_name}</p>
                            <p className="text-xs text-gray-500">
                              {booking.start_time} - {booking.end_time} ({booking.party_size} guests)
                            </p>
                            {(booking.restaurant && booking.restaurant.name) ? (
                              <p className="text-xs text-blue-600 font-medium">
                                {booking.restaurant.name} ({booking.restaurant.cuisine})
                              </p>
                            ) : booking.restaurant_id ? (
                              <p className="text-xs text-blue-600 font-medium">
                                Restaurant ID: {booking.restaurant_id}
                              </p>
                            ) : (
                              <p className="text-xs text-red-600 font-medium">
                                No restaurant info
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Bookings List */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Bookings</CardTitle>
              <CardDescription>
                Detailed view of all bookings for {format(selectedDate, 'MMM do, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dayBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No bookings for this date.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dayBookings.map(booking => {
                    const table = tables.find(t => t.id === booking.table_id);
                    return (
                      <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{booking.customer_name}</h4>
                            <p className="text-sm text-gray-600">
                              {table?.name} ({table?.capacity} capacity) - {table?.section}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {booking.party_size} {booking.party_size === 1 ? 'guest' : 'guests'}
                          </Badge>
                        </div>
                        {/* Amend/Delete Buttons */}
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => handleEditClick(booking)}>Amend</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(booking)}>Delete</Button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{booking.start_time} - {booking.end_time}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{booking.customer_email}</span>
                          </div>
                          {booking.customer_phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span>{booking.customer_phone}</span>
                            </div>
                          )}
                          {booking.restaurant && booking.restaurant.name ? (
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4 text-blue-400" />
                              <span className="text-blue-600 font-medium">{booking.restaurant.name} ({booking.restaurant.cuisine})</span>
                            </div>
                          ) : booking.restaurant_id ? (
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4 text-blue-400" />
                              <span className="text-blue-600 font-medium">Restaurant ID: {booking.restaurant_id}</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4 text-red-400" />
                              <span className="text-red-600 font-medium">No restaurant info</span>
                            </div>
                          )}
                        </div>
                        
                        {booking.special_requests && (
                          <div className="text-sm bg-amber-50 border border-amber-200 rounded p-2">
                            <p className="font-medium text-amber-800">Special Requests:</p>
                            <p className="text-amber-700">{booking.special_requests}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DashboardRestaurants />

        {/* User Management Section - Only for Admin */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage users in the system. Invite, edit, or deactivate users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Manage all users, assign roles (admin, business, user), and control access.
                  </p>
                  <p className="text-xs text-gray-500">
                    Only visible to admin users (richardhubbert@gmail.com)
                  </p>
                </div>
                <Button 
                  onClick={() => window.location.href = '/users'}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Manage Users
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      {/* Edit Booking Modal */}
      <Dialog open={!!editingBooking} onOpenChange={open => !open && setEditingBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogTitle>Amend Booking</DialogTitle>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={editForm.customer_name || ''} 
                onChange={e => handleEditChange('customer_name', e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                type="email"
                value={editForm.customer_email || ''} 
                onChange={e => handleEditChange('customer_email', e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={editForm.customer_phone || ''} 
                onChange={e => handleEditChange('customer_phone', e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Party Size</label>
              <input 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                type="number" 
                min="1"
                value={editForm.party_size || ''} 
                onChange={e => handleEditChange('party_size', Number(e.target.value))} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                rows={3}
                value={editForm.special_requests || ''} 
                onChange={e => handleEditChange('special_requests', e.target.value)} 
              />
            </div>
          </div>
          {editError && <div className="text-red-600 text-sm mt-2">{editError}</div>}
          <DialogFooter>
            <Button onClick={() => setEditingBooking(null)} variant="secondary" disabled={actionLoading}>Cancel</Button>
            <Button onClick={handleEditSave} variant="default" disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={tableDialog !== null} onOpenChange={open => { if (!open) setTableDialog(null); }}>
        <DialogContent className="max-w-md">
          <DialogTitle>{tableDialog === 'add' ? 'Add table' : 'Edit table'}</DialogTitle>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={tableForm.name}
                onChange={e => handleTableFormChange('name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                type="number"
                min="1"
                value={tableForm.capacity}
                onChange={e => setTableForm(form => ({ ...form, capacity: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={tableForm.section}
                onChange={e => handleTableFormChange('section', e.target.value)}
              />
            </div>
          </div>
          {tableError && <div className="text-red-600 text-sm mt-2">{tableError}</div>}
          <DialogFooter>
            <Button onClick={() => setTableDialog(null)} variant="secondary" disabled={tableActionLoading}>Cancel</Button>
            <Button onClick={handleTableSave} disabled={tableActionLoading}>
              {tableActionLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deletingTable} onOpenChange={open => { if (!open) setDeletingTable(null); }}>
        <DialogContent>
          <DialogTitle>Delete table</DialogTitle>
          <p>
            Delete {deletingTable?.name}? This also removes its bookings.
          </p>
          {tableError && <div className="text-red-600 text-sm mt-2">{tableError}</div>}
          <DialogFooter>
            <Button onClick={() => setDeletingTable(null)} variant="secondary" disabled={tableActionLoading}>Cancel</Button>
            <Button onClick={handleDeleteTableConfirm} variant="destructive" disabled={tableActionLoading}>
              {tableActionLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Booking Confirmation */}
      <Dialog open={!!deletingBooking} onOpenChange={open => !open && setDeletingBooking(null)}>
        <DialogContent>
          <DialogTitle>Delete Booking</DialogTitle>
          <p>Are you sure you want to delete this booking?</p>
          <DialogFooter>
            <Button onClick={() => setDeletingBooking(null)} variant="secondary" disabled={actionLoading}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} variant="destructive" disabled={actionLoading}>Delete</Button>
          </DialogFooter>
          {deleteError && <div className="text-red-600 text-sm mt-2">{deleteError}</div>}
        </DialogContent>
      </Dialog>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          refreshBookings().catch((err) => console.error('Failed to refresh bookings', err));
        }}
        restaurant={restaurants.find((restaurant) => restaurant.id === selectedRestaurant) || restaurants[0]}
        initialDate={format(selectedDate, 'yyyy-MM-dd')}
      />
    </div>
  );
};

export default AdminDashboard;

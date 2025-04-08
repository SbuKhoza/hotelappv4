import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db, storage } from '../../service/Firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { ref, getDownloadURL, listAll, uploadBytes, deleteObject } from 'firebase/storage';

// Initial state
const initialState = {
  accommodations: [],
  filteredAccommodations: [],
  selectedAccommodation: null,
  loading: false,
  error: null,
  fetchStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  createStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  updateStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  deleteStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  filterCriteria: {
    priceRange: [0, 10000],
    maxGuests: null,
    amenities: [],
    searchTerm: '',
    sortBy: 'price', // 'price' | 'name' | 'rating'
    sortDirection: 'asc' // 'asc' | 'desc'
  }
};

// Async thunk for fetching all accommodations
export const fetchAccommodations = createAsyncThunk(
  'accommodation/fetchAccommodations',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Debug Log: Fetching accommodations from Firestore');
      const accommodationCollection = collection(db, 'accommodation');
      const accommodationSnapshot = await getDocs(accommodationCollection);
      
      const accommodationList = await Promise.all(accommodationSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const imagesRef = ref(storage, `accommodations/${doc.id}`);
        
        try {
          const imagesList = await listAll(imagesRef);
          const imageUrls = await Promise.all(
            imagesList.items.map((imageRef) => getDownloadURL(imageRef))
          );
          return { ...data, id: doc.id, imageUrls };
        } catch (error) {
          console.error(`Error fetching images for accommodation ${doc.id}:`, error);
          return { ...data, id: doc.id, imageUrls: [] };
        }
      }));
      
      console.log('Debug Log: Accommodations fetched successfully:', accommodationList.length);
      return accommodationList;
    } catch (error) {
      console.error('Debug Log: Error fetching accommodations:', error);
      return rejectWithValue(error.message || 'Failed to fetch accommodations');
    }
  }
);

// Async thunk for fetching accommodations with filters
export const fetchFilteredAccommodations = createAsyncThunk(
  'accommodation/fetchFilteredAccommodations',
  async (filterCriteria, { rejectWithValue }) => {
    try {
      console.log('Debug Log: Fetching filtered accommodations from Firestore', filterCriteria);
      
      // Start with a basic query
      let accommodationQuery = collection(db, 'accommodation');
      
      // Apply filters if provided
      // Note: This is a simplified example. In a real app, you might need to use
      // more complex query combinations or do some filtering in memory
      if (filterCriteria) {
        if (filterCriteria.maxGuests) {
          accommodationQuery = query(
            accommodationQuery, 
            where('maxGuests', '>=', filterCriteria.maxGuests)
          );
        }
        
        // Add sorting
        if (filterCriteria.sortBy) {
          accommodationQuery = query(
            accommodationQuery,
            orderBy(filterCriteria.sortBy, filterCriteria.sortDirection || 'asc')
          );
        }
      }
      
      const accommodationSnapshot = await getDocs(accommodationQuery);
      
      let accommodationList = await Promise.all(accommodationSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const imagesRef = ref(storage, `accommodations/${doc.id}`);
        
        try {
          const imagesList = await listAll(imagesRef);
          const imageUrls = await Promise.all(
            imagesList.items.map((imageRef) => getDownloadURL(imageRef))
          );
          return { ...data, id: doc.id, imageUrls };
        } catch (error) {
          console.error(`Error fetching images for accommodation ${doc.id}:`, error);
          return { ...data, id: doc.id, imageUrls: [] };
        }
      }));
      
      // Apply additional filters that can't be done in the query
      if (filterCriteria) {
        // Filter by price range
        if (filterCriteria.priceRange && filterCriteria.priceRange.length === 2) {
          accommodationList = accommodationList.filter(acc => {
            const price = parseFloat(acc.price);
            return price >= filterCriteria.priceRange[0] && price <= filterCriteria.priceRange[1];
          });
        }
        
        // Filter by amenities
        if (filterCriteria.amenities && filterCriteria.amenities.length > 0) {
          accommodationList = accommodationList.filter(acc => {
            if (!acc.amenities) return false;
            return filterCriteria.amenities.every(amenity => 
              acc.amenities[amenity] === true
            );
          });
        }
        
        // Filter by search term
        if (filterCriteria.searchTerm) {
          const searchTerm = filterCriteria.searchTerm.toLowerCase();
          accommodationList = accommodationList.filter(acc => 
            acc.name.toLowerCase().includes(searchTerm) || 
            (acc.description && acc.description.toLowerCase().includes(searchTerm))
          );
        }
      }
      
      console.log('Debug Log: Filtered accommodations fetched successfully:', accommodationList.length);
      return accommodationList;
    } catch (error) {
      console.error('Debug Log: Error fetching filtered accommodations:', error);
      return rejectWithValue(error.message || 'Failed to fetch filtered accommodations');
    }
  }
);

// Async thunk for fetching a single accommodation by ID
export const fetchAccommodationDetails = createAsyncThunk(
  'accommodation/fetchAccommodationDetails',
  async (accommodationId, { rejectWithValue }) => {
    try {
      console.log(`Debug Log: Fetching accommodation details for ID: ${accommodationId}`);
      const accommodationRef = doc(db, 'accommodation', accommodationId);
      const accommodationDoc = await getDoc(accommodationRef);
      
      if (!accommodationDoc.exists()) {
        throw new Error('Accommodation not found');
      }
      
      const data = accommodationDoc.data();
      const imagesRef = ref(storage, `accommodations/${accommodationId}`);
      
      try {
        const imagesList = await listAll(imagesRef);
        const imageUrls = await Promise.all(
          imagesList.items.map((imageRef) => getDownloadURL(imageRef))
        );
        return { ...data, id: accommodationId, imageUrls };
      } catch (error) {
        console.error(`Error fetching images for accommodation ${accommodationId}:`, error);
        return { ...data, id: accommodationId, imageUrls: [] };
      }
    } catch (error) {
      console.error(`Debug Log: Error fetching accommodation details for ID ${accommodationId}:`, error);
      return rejectWithValue(error.message || 'Failed to fetch accommodation details');
    }
  }
);

// Async thunk for creating a new accommodation
export const createAccommodation = createAsyncThunk(
  'accommodation/createAccommodation',
  async ({ accommodationData, imageFiles }, { rejectWithValue }) => {
    try {
      console.log('Debug Log: Creating new accommodation', accommodationData);
      
      // Add the accommodation to Firestore
      const accommodationRef = await addDoc(collection(db, 'accommodation'), {
        ...accommodationData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      const accommodationId = accommodationRef.id;
      console.log(`Debug Log: Accommodation created with ID: ${accommodationId}`);
      
      // Upload images if provided
      let imageUrls = [];
      if (imageFiles && imageFiles.length > 0) {
        const imagesRef = ref(storage, `accommodations/${accommodationId}`);
        
        imageUrls = await Promise.all(imageFiles.map(async (file, index) => {
          const fileRef = ref(imagesRef, `image_${index}`);
          await uploadBytes(fileRef, file);
          return getDownloadURL(fileRef);
        }));
        
        console.log(`Debug Log: Uploaded ${imageUrls.length} images for accommodation ${accommodationId}`);
      }
      
      return { 
        ...accommodationData, 
        id: accommodationId, 
        imageUrls 
      };
    } catch (error) {
      console.error('Debug Log: Error creating accommodation:', error);
      return rejectWithValue(error.message || 'Failed to create accommodation');
    }
  }
);

// Async thunk for updating an accommodation
export const updateAccommodation = createAsyncThunk(
  'accommodation/updateAccommodation',
  async ({ accommodationId, accommodationData, imageFiles, imagesToDelete }, { rejectWithValue }) => {
    try {
      console.log(`Debug Log: Updating accommodation ${accommodationId}`, accommodationData);
      
      // Update the accommodation in Firestore
      const accommodationRef = doc(db, 'accommodation', accommodationId);
      await updateDoc(accommodationRef, {
        ...accommodationData,
        updatedAt: new Date().toISOString()
      });
      
      // Delete images if specified
      if (imagesToDelete && imagesToDelete.length > 0) {
        const imagesRef = ref(storage, `accommodations/${accommodationId}`);
        
        await Promise.all(imagesToDelete.map(async (imageUrl) => {
          // Extract the image name from the URL
          const imageName = imageUrl.split('/').pop().split('?')[0];
          const imageRef = ref(imagesRef, imageName);
          return deleteObject(imageRef);
        }));
        
        console.log(`Debug Log: Deleted ${imagesToDelete.length} images for accommodation ${accommodationId}`);
      }
      
      // Upload new images if provided
      let newImageUrls = [];
      if (imageFiles && imageFiles.length > 0) {
        const imagesRef = ref(storage, `accommodations/${accommodationId}`);
        
        newImageUrls = await Promise.all(imageFiles.map(async (file, index) => {
          const fileRef = ref(imagesRef, `image_${Date.now()}_${index}`);
          await uploadBytes(fileRef, file);
          return getDownloadURL(fileRef);
        }));
        
        console.log(`Debug Log: Uploaded ${newImageUrls.length} new images for accommodation ${accommodationId}`);
      }
      
      // Get the updated accommodation with images
      const updatedAccommodationDoc = await getDoc(accommodationRef);
      const updatedData = updatedAccommodationDoc.data();
      
      // Get all current images
      const imagesRef = ref(storage, `accommodations/${accommodationId}`);
      const imagesList = await listAll(imagesRef);
      const allImageUrls = await Promise.all(
        imagesList.items.map((imageRef) => getDownloadURL(imageRef))
      );
      
      return { 
        ...updatedData, 
        id: accommodationId, 
        imageUrls: allImageUrls 
      };
    } catch (error) {
      console.error(`Debug Log: Error updating accommodation ${accommodationId}:`, error);
      return rejectWithValue(error.message || 'Failed to update accommodation');
    }
  }
);

// Async thunk for deleting an accommodation
export const deleteAccommodation = createAsyncThunk(
  'accommodation/deleteAccommodation',
  async (accommodationId, { rejectWithValue }) => {
    try {
      console.log(`Debug Log: Deleting accommodation ${accommodationId}`);
      
      // Delete the accommodation from Firestore
      const accommodationRef = doc(db, 'accommodation', accommodationId);
      await deleteDoc(accommodationRef);
      
      // Delete all images
      const imagesRef = ref(storage, `accommodations/${accommodationId}`);
      const imagesList = await listAll(imagesRef);
      
      await Promise.all(imagesList.items.map(async (imageRef) => {
        return deleteObject(imageRef);
      }));
      
      console.log(`Debug Log: Accommodation ${accommodationId} and its images deleted successfully`);
      return accommodationId;
    } catch (error) {
      console.error(`Debug Log: Error deleting accommodation ${accommodationId}:`, error);
      return rejectWithValue(error.message || 'Failed to delete accommodation');
    }
  }
);

// Create the accommodation slice
const accommodationSlice = createSlice({
  name: 'accommodation',
  initialState,
  reducers: {
    clearAccommodationState: (state) => {
      state.selectedAccommodation = null;
      state.error = null;
      state.fetchStatus = 'idle';
      state.createStatus = 'idle';
      state.updateStatus = 'idle';
      state.deleteStatus = 'idle';
    },
    setSelectedAccommodation: (state, action) => {
      state.selectedAccommodation = action.payload;
    },
    setFilterCriteria: (state, action) => {
      state.filterCriteria = {
        ...state.filterCriteria,
        ...action.payload
      };
    },
    resetFilterCriteria: (state) => {
      state.filterCriteria = initialState.filterCriteria;
    },
    sortAccommodations: (state, action) => {
      const { sortBy, sortDirection } = action.payload;
      state.filterCriteria.sortBy = sortBy;
      state.filterCriteria.sortDirection = sortDirection;
      
      // Apply sorting to the current accommodations
      const sortFn = (a, b) => {
        let valueA, valueB;
        
        if (sortBy === 'price') {
          valueA = parseFloat(a.price);
          valueB = parseFloat(b.price);
        } else if (sortBy === 'name') {
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
        } else if (sortBy === 'rating') {
          valueA = a.rating || 0;
          valueB = b.rating || 0;
        } else {
          return 0;
        }
        
        if (sortDirection === 'asc') {
          return valueA > valueB ? 1 : -1;
        } else {
          return valueA < valueB ? 1 : -1;
        }
      };
      
      state.accommodations = [...state.accommodations].sort(sortFn);
      state.filteredAccommodations = [...state.filteredAccommodations].sort(sortFn);
    },
    filterAccommodations: (state, action) => {
      const { searchTerm, priceRange, maxGuests, amenities } = action.payload;
      
      // Update filter criteria
      state.filterCriteria = {
        ...state.filterCriteria,
        searchTerm: searchTerm || state.filterCriteria.searchTerm,
        priceRange: priceRange || state.filterCriteria.priceRange,
        maxGuests: maxGuests || state.filterCriteria.maxGuests,
        amenities: amenities || state.filterCriteria.amenities
      };
      
      // Apply filters to the current accommodations
      let filtered = [...state.accommodations];
      
      // Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(acc => 
          acc.name.toLowerCase().includes(term) || 
          (acc.description && acc.description.toLowerCase().includes(term))
        );
      }
      
      // Filter by price range
      if (priceRange && priceRange.length === 2) {
        filtered = filtered.filter(acc => {
          const price = parseFloat(acc.price);
          return price >= priceRange[0] && price <= priceRange[1];
        });
      }
      
      // Filter by max guests
      if (maxGuests) {
        filtered = filtered.filter(acc => {
          return acc.maxGuests >= maxGuests;
        });
      }
      
      // Filter by amenities
      if (amenities && amenities.length > 0) {
        filtered = filtered.filter(acc => {
          if (!acc.amenities) return false;
          return amenities.every(amenity => 
            acc.amenities[amenity] === true
          );
        });
      }
      
      state.filteredAccommodations = filtered;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchAccommodations
      .addCase(fetchAccommodations.pending, (state) => {
        state.loading = true;
        state.fetchStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchAccommodations.fulfilled, (state, action) => {
        state.loading = false;
        state.fetchStatus = 'succeeded';
        state.accommodations = action.payload;
        state.filteredAccommodations = action.payload;
      })
      .addCase(fetchAccommodations.rejected, (state, action) => {
        state.loading = false;
        state.fetchStatus = 'failed';
        state.error = action.payload;
      })
      
      // Handle fetchFilteredAccommodations
      .addCase(fetchFilteredAccommodations.pending, (state) => {
        state.loading = true;
        state.fetchStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchFilteredAccommodations.fulfilled, (state, action) => {
        state.loading = false;
        state.fetchStatus = 'succeeded';
        state.filteredAccommodations = action.payload;
      })
      .addCase(fetchFilteredAccommodations.rejected, (state, action) => {
        state.loading = false;
        state.fetchStatus = 'failed';
        state.error = action.payload;
      })
      
      // Handle fetchAccommodationDetails
      .addCase(fetchAccommodationDetails.pending, (state) => {
        state.loading = true;
        state.fetchStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchAccommodationDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.fetchStatus = 'succeeded';
        state.selectedAccommodation = action.payload;
      })
      .addCase(fetchAccommodationDetails.rejected, (state, action) => {
        state.loading = false;
        state.fetchStatus = 'failed';
        state.error = action.payload;
      })
      
      // Handle createAccommodation
      .addCase(createAccommodation.pending, (state) => {
        state.createStatus = 'loading';
        state.error = null;
      })
      .addCase(createAccommodation.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';
        state.accommodations.push(action.payload);
        state.filteredAccommodations.push(action.payload);
      })
      .addCase(createAccommodation.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.error = action.payload;
      })
      
      // Handle updateAccommodation
      .addCase(updateAccommodation.pending, (state) => {
        state.updateStatus = 'loading';
        state.error = null;
      })
      .addCase(updateAccommodation.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded';
        
        // Update in accommodations array
        const index = state.accommodations.findIndex(acc => acc.id === action.payload.id);
        if (index !== -1) {
          state.accommodations[index] = action.payload;
        }
        
        // Update in filteredAccommodations array
        const filteredIndex = state.filteredAccommodations.findIndex(acc => acc.id === action.payload.id);
        if (filteredIndex !== -1) {
          state.filteredAccommodations[filteredIndex] = action.payload;
        }
        
        // Update selectedAccommodation if it's the same one
        if (state.selectedAccommodation && state.selectedAccommodation.id === action.payload.id) {
          state.selectedAccommodation = action.payload;
        }
      })
      .addCase(updateAccommodation.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.error = action.payload;
      })
      
      // Handle deleteAccommodation
      .addCase(deleteAccommodation.pending, (state) => {
        state.deleteStatus = 'loading';
        state.error = null;
      })
      .addCase(deleteAccommodation.fulfilled, (state, action) => {
        state.deleteStatus = 'succeeded';
        
        // Remove from accommodations array
        state.accommodations = state.accommodations.filter(acc => acc.id !== action.payload);
        
        // Remove from filteredAccommodations array
        state.filteredAccommodations = state.filteredAccommodations.filter(acc => acc.id !== action.payload);
        
        // Clear selectedAccommodation if it's the same one
        if (state.selectedAccommodation && state.selectedAccommodation.id === action.payload) {
          state.selectedAccommodation = null;
        }
      })
      .addCase(deleteAccommodation.rejected, (state, action) => {
        state.deleteStatus = 'failed';
        state.error = action.payload;
      });
  },
});

// Export actions
export const { 
  clearAccommodationState, 
  setSelectedAccommodation,
  setFilterCriteria,
  resetFilterCriteria,
  sortAccommodations,
  filterAccommodations
} = accommodationSlice.actions;

// Export selectors
export const selectAccommodations = (state) => state.accommodation.accommodations;
export const selectFilteredAccommodations = (state) => state.accommodation.filteredAccommodations;
export const selectAccommodation = (state) => state.accommodation.selectedAccommodation;
export const selectLoading = (state) => state.accommodation.loading;
export const selectError = (state) => state.accommodation.error;
export const selectFetchStatus = (state) => state.accommodation.fetchStatus;
export const selectCreateStatus = (state) => state.accommodation.createStatus;
export const selectUpdateStatus = (state) => state.accommodation.updateStatus;
export const selectDeleteStatus = (state) => state.accommodation.deleteStatus;
export const selectFilterCriteria = (state) => state.accommodation.filterCriteria;

// Export reducer
export default accommodationSlice.reducer;
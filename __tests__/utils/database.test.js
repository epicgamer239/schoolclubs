import { 
  addDoc, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  writeBatch,
  runTransaction
} from '../../utils/database'

// Mock Firebase
const mockAddDoc = jest.fn()
const mockCollection = jest.fn()
const mockDoc = jest.fn()
const mockGetDoc = jest.fn()
const mockGetDocs = jest.fn()
const mockUpdateDoc = jest.fn()
const mockDeleteDoc = jest.fn()
const mockQuery = jest.fn()
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockLimit = jest.fn()
const mockStartAfter = jest.fn()
const mockOnSnapshot = jest.fn()
const mockWriteBatch = jest.fn()
const mockRunTransaction = jest.fn()

jest.mock('../../firebase', () => ({
  firestore: {
    addDoc: mockAddDoc,
    collection: mockCollection,
    doc: mockDoc,
    getDoc: mockGetDoc,
    getDocs: mockGetDocs,
    updateDoc: mockUpdateDoc,
    deleteDoc: mockDeleteDoc,
    query: mockQuery,
    where: mockWhere,
    orderBy: mockOrderBy,
    limit: mockLimit,
    startAfter: mockStartAfter,
    onSnapshot: mockOnSnapshot,
    writeBatch: mockWriteBatch,
    runTransaction: mockRunTransaction,
  },
}))

describe('Database Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('addDoc', () => {
    test('adds document to collection', async () => {
      const mockData = { name: 'Test Club', description: 'Test Description' }
      const mockDocRef = { id: 'test-id' }
      mockAddDoc.mockResolvedValue(mockDocRef)

      const result = await addDoc('clubs', mockData)

      expect(mockAddDoc).toHaveBeenCalledWith(expect.anything(), mockData)
      expect(result).toBe(mockDocRef)
    })

    test('handles errors gracefully', async () => {
      const mockError = new Error('Database error')
      mockAddDoc.mockRejectedValue(mockError)

      await expect(addDoc('clubs', {})).rejects.toThrow('Database error')
    })
  })

  describe('collection', () => {
    test('creates collection reference', () => {
      const mockCollectionRef = { id: 'clubs' }
      mockCollection.mockReturnValue(mockCollectionRef)

      const result = collection('clubs')

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'clubs')
      expect(result).toBe(mockCollectionRef)
    })
  })

  describe('doc', () => {
    test('creates document reference', () => {
      const mockDocRef = { id: 'test-id' }
      mockDoc.mockReturnValue(mockDocRef)

      const result = doc('clubs', 'test-id')

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'clubs', 'test-id')
      expect(result).toBe(mockDocRef)
    })
  })

  describe('getDoc', () => {
    test('retrieves document data', async () => {
      const mockDocData = { id: 'test-id', name: 'Test Club' }
      const mockDocSnap = { 
        exists: () => true, 
        data: () => mockDocData,
        id: 'test-id'
      }
      mockGetDoc.mockResolvedValue(mockDocSnap)

      const result = await getDoc('clubs', 'test-id')

      expect(mockGetDoc).toHaveBeenCalledWith(expect.anything())
      expect(result).toEqual({ id: 'test-id', ...mockDocData })
    })

    test('returns null for non-existent document', async () => {
      const mockDocSnap = { 
        exists: () => false,
        id: 'test-id'
      }
      mockGetDoc.mockResolvedValue(mockDocSnap)

      const result = await getDoc('clubs', 'test-id')

      expect(result).toBeNull()
    })

    test('handles errors gracefully', async () => {
      const mockError = new Error('Document not found')
      mockGetDoc.mockRejectedValue(mockError)

      await expect(getDoc('clubs', 'test-id')).rejects.toThrow('Document not found')
    })
  })

  describe('getDocs', () => {
    test('retrieves multiple documents', async () => {
      const mockDocs = [
        { id: 'doc1', data: () => ({ name: 'Club 1' }) },
        { id: 'doc2', data: () => ({ name: 'Club 2' }) },
      ]
      const mockQuerySnap = {
        docs: mockDocs,
        empty: false,
        size: 2
      }
      mockGetDocs.mockResolvedValue(mockQuerySnap)

      const result = await getDocs('clubs')

      expect(mockGetDocs).toHaveBeenCalledWith(expect.anything())
      expect(result).toEqual([
        { id: 'doc1', name: 'Club 1' },
        { id: 'doc2', name: 'Club 2' },
      ])
    })

    test('returns empty array for empty collection', async () => {
      const mockQuerySnap = {
        docs: [],
        empty: true,
        size: 0
      }
      mockGetDocs.mockResolvedValue(mockQuerySnap)

      const result = await getDocs('clubs')

      expect(result).toEqual([])
    })

    test('handles errors gracefully', async () => {
      const mockError = new Error('Collection error')
      mockGetDocs.mockRejectedValue(mockError)

      await expect(getDocs('clubs')).rejects.toThrow('Collection error')
    })
  })

  describe('updateDoc', () => {
    test('updates document data', async () => {
      const mockUpdateData = { name: 'Updated Club' }
      mockUpdateDoc.mockResolvedValue()

      await updateDoc('clubs', 'test-id', mockUpdateData)

      expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), mockUpdateData)
    })

    test('handles errors gracefully', async () => {
      const mockError = new Error('Update failed')
      mockUpdateDoc.mockRejectedValue(mockError)

      await expect(updateDoc('clubs', 'test-id', {})).rejects.toThrow('Update failed')
    })
  })

  describe('deleteDoc', () => {
    test('deletes document', async () => {
      mockDeleteDoc.mockResolvedValue()

      await deleteDoc('clubs', 'test-id')

      expect(mockDeleteDoc).toHaveBeenCalledWith(expect.anything())
    })

    test('handles errors gracefully', async () => {
      const mockError = new Error('Delete failed')
      mockDeleteDoc.mockRejectedValue(mockError)

      await expect(deleteDoc('clubs', 'test-id')).rejects.toThrow('Delete failed')
    })
  })

  describe('query', () => {
    test('creates query with conditions', () => {
      const mockQueryRef = { id: 'query' }
      mockQuery.mockReturnValue(mockQueryRef)

      const result = query('clubs', where('schoolId', '==', 'test-school'))

      expect(mockQuery).toHaveBeenCalledWith(expect.anything(), expect.anything())
      expect(result).toBe(mockQueryRef)
    })

    test('creates query with multiple conditions', () => {
      const mockQueryRef = { id: 'query' }
      mockQuery.mockReturnValue(mockQueryRef)

      const result = query(
        'clubs', 
        where('schoolId', '==', 'test-school'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      )

      expect(mockQuery).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(), expect.anything())
      expect(result).toBe(mockQueryRef)
    })
  })

  describe('where', () => {
    test('creates where condition', () => {
      const mockWhereRef = { field: 'schoolId', op: '==', value: 'test-school' }
      mockWhere.mockReturnValue(mockWhereRef)

      const result = where('schoolId', '==', 'test-school')

      expect(mockWhere).toHaveBeenCalledWith('schoolId', '==', 'test-school')
      expect(result).toBe(mockWhereRef)
    })
  })

  describe('orderBy', () => {
    test('creates orderBy condition', () => {
      const mockOrderByRef = { field: 'createdAt', direction: 'desc' }
      mockOrderBy.mockReturnValue(mockOrderByRef)

      const result = orderBy('createdAt', 'desc')

      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc')
      expect(result).toBe(mockOrderByRef)
    })
  })

  describe('limit', () => {
    test('creates limit condition', () => {
      const mockLimitRef = { limit: 10 }
      mockLimit.mockReturnValue(mockLimitRef)

      const result = limit(10)

      expect(mockLimit).toHaveBeenCalledWith(10)
      expect(result).toBe(mockLimitRef)
    })
  })

  describe('startAfter', () => {
    test('creates startAfter condition', () => {
      const mockDoc = { id: 'last-doc' }
      const mockStartAfterRef = { startAfter: mockDoc }
      mockStartAfter.mockReturnValue(mockStartAfterRef)

      const result = startAfter(mockDoc)

      expect(mockStartAfter).toHaveBeenCalledWith(mockDoc)
      expect(result).toBe(mockStartAfterRef)
    })
  })

  describe('onSnapshot', () => {
    test('sets up real-time listener', () => {
      const mockUnsubscribe = jest.fn()
      mockOnSnapshot.mockReturnValue(mockUnsubscribe)

      const mockCallback = jest.fn()
      const result = onSnapshot('clubs', mockCallback)

      expect(mockOnSnapshot).toHaveBeenCalledWith(expect.anything(), mockCallback)
      expect(result).toBe(mockUnsubscribe)
    })
  })

  describe('writeBatch', () => {
    test('creates write batch', () => {
      const mockBatch = { set: jest.fn(), update: jest.fn(), delete: jest.fn(), commit: jest.fn() }
      mockWriteBatch.mockReturnValue(mockBatch)

      const result = writeBatch()

      expect(mockWriteBatch).toHaveBeenCalledWith(expect.anything())
      expect(result).toBe(mockBatch)
    })
  })

  describe('runTransaction', () => {
    test('runs transaction', async () => {
      const mockTransaction = { get: jest.fn(), set: jest.fn(), update: jest.fn(), delete: jest.fn() }
      mockRunTransaction.mockImplementation(async (updateFunction) => {
        await updateFunction(mockTransaction)
        return { success: true }
      })

      const updateFunction = jest.fn()
      const result = await runTransaction(updateFunction)

      expect(mockRunTransaction).toHaveBeenCalledWith(expect.anything(), updateFunction)
      expect(updateFunction).toHaveBeenCalledWith(mockTransaction)
      expect(result).toEqual({ success: true })
    })

    test('handles transaction errors', async () => {
      const mockError = new Error('Transaction failed')
      mockRunTransaction.mockRejectedValue(mockError)

      await expect(runTransaction(jest.fn())).rejects.toThrow('Transaction failed')
    })
  })

  describe('Tag-specific operations', () => {
    test('creates tag document', async () => {
      const mockTagData = { 
        name: 'Test Tag', 
        description: 'Test Description', 
        color: '#FF5733',
        usageCount: 0,
        createdAt: expect.any(Date)
      }
      const mockDocRef = { id: 'tag-id' }
      mockAddDoc.mockResolvedValue(mockDocRef)

      const result = await addDoc('tags', mockTagData)

      expect(mockAddDoc).toHaveBeenCalledWith(expect.anything(), mockTagData)
      expect(result).toBe(mockDocRef)
    })

    test('updates tag usage count', async () => {
      const mockUpdateData = { usageCount: 5 }
      mockUpdateDoc.mockResolvedValue()

      await updateDoc('tags', 'tag-id', mockUpdateData)

      expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), mockUpdateData)
    })

    test('queries tags by school', async () => {
      const mockDocs = [
        { id: 'tag1', data: () => ({ name: 'Tag 1', schoolId: 'school1' }) },
        { id: 'tag2', data: () => ({ name: 'Tag 2', schoolId: 'school1' }) },
      ]
      const mockQuerySnap = {
        docs: mockDocs,
        empty: false,
        size: 2
      }
      mockGetDocs.mockResolvedValue(mockQuerySnap)

      const result = await getDocs('tags')

      expect(mockGetDocs).toHaveBeenCalledWith(expect.anything())
      expect(result).toEqual([
        { id: 'tag1', name: 'Tag 1', schoolId: 'school1' },
        { id: 'tag2', name: 'Tag 2', schoolId: 'school1' },
      ])
    })
  })
}) 
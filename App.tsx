import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import BalanceSummary from './components/BalanceSummary';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Reports from './components/Reports';
import Login from './components/Login';
import Register from './components/Register';
import Homepage from './components/Homepage';
import Footer from './components/Footer';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import Settings from './components/Settings';
import Profile from './components/Profile';
import MSBForm from './components/MSB';
import MSBHomepage from './components/MSBHomepage';
import EditTransactionModal from './components/EditTransactionModal';
import EditMSBTransactionModal from './components/EditMSBTransactionModal'; // New Import
import { Transaction, TransactionType, Book, View, User, TransactionCategory, MSBDetails, MSBTransactionStatus, BookType } from './types';
import MSBBookList from './components/MSBBookList';
import GeneralBookList from './components/GeneralBookList';

type Theme = 'light' | 'dark';
type AppContext = 'GENERAL' | 'MSB';

interface AppState {
  users: User[];
  currentUserId: string | null;
  activeBookId: string | null;
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    users: [],
    currentUserId: null,
    activeBookId: null,
  });
  const [activeView, setActiveView] = useState<View>(View.HOME);
  const [appContext, setAppContext] = useState<AppContext>('GENERAL');
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<string>(navigator.language || 'en-US');
  const [initialLoading, setInitialLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [addBookModalIsMsb, setAddBookModalIsMsb] = useState(false);
  const [isMSBFormOpen, setIsMSBFormOpen] = useState(false);
  
  const { users, currentUserId, activeBookId } = appState;

  // Load theme from localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem('finebook-theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (prefersDark) {
      setTheme('dark');
    }
  }, []);

  // Apply theme class to HTML element and save to localStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('finebook-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('finebook-theme', 'light');
    }
  }, [theme]);

  // Load language from localStorage
  useEffect(() => {
    const storedLanguage = localStorage.getItem('finebook-language');
    if (storedLanguage) {
      setLanguage(storedLanguage);
    }
  }, []);

  // Save language to localStorage
  useEffect(() => {
    localStorage.setItem('finebook-language', language);
  }, [language]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Load users and session on initial render
  useEffect(() => {
    let loadedUsers: User[] = [];
    try {
      const storedUsers = localStorage.getItem('finebook-users');
      if (storedUsers) {
        // Migration: ensure books have a type
        loadedUsers = JSON.parse(storedUsers).map((u: any) => ({
             ...u, 
             msbTransactions: undefined, // remove old property
             books: u.books.map((b: any) => ({...b, type: b.type || BookType.GENERAL})) 
        }));
      }
    } catch (error) {
      console.error("Failed to parse users from localStorage", error);
    }

    let sessionUserId: string | null = null;
    let initialActiveBookId: string | null = null;
    let initialView = View.HOME;

    try {
      const storedSessionUserId = sessionStorage.getItem('finebook-currentUser');
      if (storedSessionUserId) {
        const sessionUser = loadedUsers.find(u => u.id === storedSessionUserId);
        if (sessionUser) {
          sessionUserId = storedSessionUserId;
          const firstGeneralBook = sessionUser.books.find(b => b.type === BookType.GENERAL);
          initialView = View.GENERAL_BOOK_LIST;
          initialActiveBookId = firstGeneralBook?.id || null;
        }
      }
    } catch (error) {
      console.error("Failed to load user session", error);
    } finally {
      setAppState({
        users: loadedUsers,
        currentUserId: sessionUserId,
        activeBookId: initialActiveBookId,
      });
      setActiveView(initialView);
      setInitialLoading(false);
    }
  }, []);

  // Save users to localStorage whenever the array changes
  useEffect(() => {
    // Only save when not loading to avoid overwriting loaded data with initial empty state
    if (!initialLoading) {
      try {
        localStorage.setItem('finebook-users', JSON.stringify(users));
      } catch (error) {
        console.error("Failed to save users to localStorage", error);
      }
    }
  }, [users, initialLoading]);

  // DERIVED STATE
  const currentUser = useMemo(() => users.find(u => u.id === currentUserId), [users, currentUserId]);
  const generalBooks = useMemo(() => currentUser?.books.filter(b => b.type === BookType.GENERAL) || [], [currentUser]);
  const msbBooks = useMemo(() => currentUser?.books.filter(b => b.type === BookType.MSB) || [], [currentUser]);
  const activeBook = useMemo(() => currentUser?.books.find(b => b.id === activeBookId), [currentUser, activeBookId]);
  const activeBookCurrency = useMemo(() => activeBook?.currency || 'USD', [activeBook]);
  const editingTransaction = useMemo(() => activeBook?.transactions.find(t => t.id === editingTransactionId), [activeBook, editingTransactionId]);

  const handleNavigation = (action: () => void) => {
    if (isPageLoading) return;
    setIsPageLoading(true);
    setTimeout(() => {
        action();
        setTimeout(() => {
            setIsPageLoading(false);
        }, 50); // Short delay to allow content to render before fade out
    }, 300); // Should match fade-in duration of the overlay
  };

  const selectView = (view: View) => {
    if (view === activeView && view !== View.GENERAL_BOOK_LIST && view !== View.MSB_BOOK_LIST) return;
    handleNavigation(() => {
      if (view === View.REPORTS || view === View.SETTINGS) {
        // These views depend on the current context, so we don't change it
         setActiveView(view);
      } else if (view === View.DASHBOARD) {
        // This is now an invalid direct navigation target, redirect to the list
        setAppContext('GENERAL');
        setActiveView(View.GENERAL_BOOK_LIST);
      }
      else {
         setActiveView(view);
      }
    });
  };
  
  const handleGeneralNav = () => {
    handleNavigation(() => {
        setAppContext('GENERAL');
        setActiveView(View.GENERAL_BOOK_LIST);
    });
  };

  const handleMSBNav = () => {
    handleNavigation(() => {
      setAppContext('MSB');
      if (msbBooks.length > 0) {
        setActiveView(View.MSB_BOOK_LIST);
      } else {
        setActiveView(View.MSB_HOME);
      }
    });
  };
  
  const handleBackToList = () => {
    handleNavigation(() => {
        setActiveView(appContext === 'GENERAL' ? View.GENERAL_BOOK_LIST : View.MSB_BOOK_LIST);
    });
  };

  const selectBookAndGoToDashboard = (id: string) => {
    if (isPageLoading) return;
    setIsPageLoading(true);
    setTimeout(() => {
      setAppState(prev => ({ ...prev, activeBookId: id }));
      setIsMSBFormOpen(false);
      setActiveView(View.DASHBOARD);
      setTimeout(() => {
        setIsPageLoading(false);
      }, 50);
    }, 300);
  };

  const initiateExportHandler = async (exportFunction: () => void) => {
    setIsPageLoading(true);
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
        exportFunction();
    } catch (error) {
        console.error("Export failed:", error);
    } finally {
        setTimeout(() => setIsPageLoading(false), 1000);
    }
  };


  const handleAddTransaction = (transaction: Omit<Transaction, 'id' | 'date' | 'category' | 'msbDetails'>) => {
    const bookId = activeBookId;
    if (!currentUserId || !bookId) return;

    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      category: TransactionCategory.GENERAL,
    };
    
    setAppState(prev => ({
        ...prev,
        users: prev.users.map(user => {
            if (user.id === prev.currentUserId) {
                const updatedBooks = user.books.map(book => {
                    if (book.id === bookId) {
                        const updatedTransactions = [newTransaction, ...book.transactions]
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        return { ...book, transactions: updatedTransactions };
                    }
                    return book;
                });
                return { ...user, books: updatedBooks };
            }
            return user;
        })
    }));
  };

  const handleAddMSBTransaction = (description: string, msbDetails: MSBDetails) => {
    const bookId = activeBookId;
    if (!currentUserId || !bookId) return;
    
    const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        description,
        amount: msbDetails.receivingAmount,
        type: TransactionType.INCOME,
        date: new Date().toISOString(),
        category: TransactionCategory.MSB,
        msbDetails,
    };
    
     setAppState(prev => ({
        ...prev,
        users: prev.users.map(user => {
            if (user.id === prev.currentUserId) {
                const updatedBooks = user.books.map(book => {
                    if (book.id === bookId) {
                        const updatedTransactions = [newTransaction, ...book.transactions]
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        return { ...book, transactions: updatedTransactions };
                    }
                    return book;
                });
                return { ...user, books: updatedBooks };
            }
            return user;
        })
    }));
    setIsMSBFormOpen(false);
  };

  const handleUpdateMSBStatus = (transactionId: string, status: MSBTransactionStatus) => {
    const bookId = activeBookId;
    if (!currentUserId || !bookId) return;

    setAppState(prev => ({
        ...prev,
        users: prev.users.map(user => {
            if (user.id === prev.currentUserId) {
                const updatedBooks = user.books.map(book => {
                    if (book.id === bookId) {
                       const updatedTransactions = book.transactions.map(t => {
                           if (t.id === transactionId && t.msbDetails) {
                               return {
                                   ...t,
                                   msbDetails: { ...t.msbDetails, status }
                               };
                           }
                           return t;
                       });
                       return { ...book, transactions: updatedTransactions };
                    }
                    return book;
                });
                return { ...user, books: updatedBooks };
            }
            return user;
        })
    }));
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
        setAppState(prev => {
            const userIndex = prev.users.findIndex(u => u.id === prev.currentUserId);
            if (userIndex === -1) return prev;
            const oldUser = prev.users[userIndex];
            const updatedBooks = oldUser.books.map(book => ({
                ...book,
                transactions: book.transactions.filter(t => t.id !== id)
            }));
            const updatedUser = { ...oldUser, books: updatedBooks };
            const updatedUsers = [...prev.users];
            updatedUsers[userIndex] = updatedUser;
            return { ...prev, users: updatedUsers };
        });
    }
  };
  
  const handleUpdateTransaction = (updatedTransactionData: Omit<Transaction, 'id' | 'date' | 'lastModified' | 'category' | 'msbDetails'>) => {
    if (!currentUserId || !activeBookId || !editingTransactionId) return;

    setAppState(prev => ({
      ...prev,
      users: prev.users.map(user => {
        if (user.id === prev.currentUserId) {
          const updatedBooks = user.books.map(book => {
            if (book.id === prev.activeBookId) {
              const updatedTransactions = book.transactions.map(t =>
                t.id === editingTransactionId ? { ...t, ...updatedTransactionData, lastModified: new Date().toISOString() } : t
              );
              return { ...book, transactions: updatedTransactions };
            }
            return book;
          });
          return { ...user, books: updatedBooks };
        }
        return user;
      })
    }));
    setEditingTransactionId(null);
  };

  const handleUpdateMSBTransaction = (updatedData: { description: string; msbDetails: MSBDetails }) => {
    if (!currentUserId || !activeBookId || !editingTransactionId) return;

    setAppState(prev => ({
        ...prev,
        users: prev.users.map(user => {
            if (user.id === prev.currentUserId) {
                const updatedBooks = user.books.map(book => {
                    if (book.id === prev.activeBookId) {
                        const updatedTransactions = book.transactions.map(t => {
                            if (t.id === editingTransactionId) {
                                return {
                                    ...t,
                                    description: updatedData.description,
                                    msbDetails: updatedData.msbDetails,
                                    amount: updatedData.msbDetails.receivingAmount,
                                    lastModified: new Date().toISOString()
                                };
                            }
                            return t;
                        });
                        return { ...book, transactions: updatedTransactions };
                    }
                    return book;
                });
                return { ...user, books: updatedBooks };
            }
            return user;
        })
    }));
    setEditingTransactionId(null);
  };

  const handleAddBook = (name: string, currency: string, isMsb: boolean): boolean => {
    let success = false;
    const newBook: Book = { 
        id: crypto.randomUUID(), 
        name, 
        currency, 
        transactions: [],
        type: isMsb ? BookType.MSB : BookType.GENERAL,
    };
    
    setAppState(prev => {
      if (!prev.currentUserId) return prev;
      const userToUpdate = prev.users.find(u => u.id === prev.currentUserId);
      if (!userToUpdate || userToUpdate.books.some(book => book.name.toLowerCase() === name.toLowerCase())) {
        success = false;
        return prev;
      }
      
      const updatedUser = { ...userToUpdate, books: [...userToUpdate.books, newBook] };
      const updatedUsers = prev.users.map(u => u.id === prev.currentUserId ? updatedUser : u);
      success = true;

      handleNavigation(() => {
        setAppContext(isMsb ? 'MSB' : 'GENERAL');
        setActiveView(View.DASHBOARD);
        setAppState(prev => ({
             ...prev,
            users: updatedUsers,
            activeBookId: newBook.id
        }));
      });

      return { ...prev, users: updatedUsers };
    });
    return success;
  };

  const handleDeleteBook = () => {
    const user = currentUser;
    if (!user || !activeBookId) return;
    const bookToDelete = user.books.find(b => b.id === activeBookId);
    if (!bookToDelete) return;

    if (user.books.filter(b => b.type === bookToDelete.type).length <= 1) {
        alert("This is your only book of this type and cannot be deleted.");
        return;
    }

    const confirmationMessage = `Are you sure you want to permanently delete the book "${bookToDelete.name}"? This will also delete all ${bookToDelete.transactions.length} associated transactions. This action cannot be undone.`;

    if (window.confirm(confirmationMessage)) {
        handleNavigation(() => {
            setAppState(prev => {
                const userIndex = prev.users.findIndex(u => u.id === prev.currentUserId);
                if (userIndex === -1) return prev;
                const oldUser = prev.users[userIndex];
                const updatedBooks = oldUser.books.filter(b => b.id !== activeBookId);
                const relevantBooks = updatedBooks.filter(b => b.type === bookToDelete.type);
                const nextActiveBookId = relevantBooks[0]?.id || null;
                const updatedUser = { ...oldUser, books: updatedBooks };
                const updatedUsers = [...prev.users];
                updatedUsers[userIndex] = updatedUser;
                
                // Also update the active view to go back to the list
                setActiveView(appContext === 'GENERAL' ? View.GENERAL_BOOK_LIST : View.MSB_BOOK_LIST);

                return { ...prev, users: updatedUsers, activeBookId: nextActiveBookId };
            });
        });
    }
  };
  
  const handleUpdateBookCurrency = (bookId: string, newCurrency: string) => {
    if (!currentUserId) return;
    setAppState(prev => ({
        ...prev,
        users: prev.users.map(user => user.id === prev.currentUserId ? { ...user, books: user.books.map(b => b.id === bookId ? { ...b, currency: newCurrency } : b) } : user)
    }));
  };

  const handleUpdateUserProfile = (name: string, phoneNumber: string, email: string): { success: boolean, error?: string } => {
    if (!currentUserId) return { success: false, error: "Not logged in." };
    if (users.some(u => u.id !== currentUserId && u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, error: "This email address is already in use by another account." };
    }
    setAppState(prev => ({
        ...prev,
        users: prev.users.map(user => user.id === prev.currentUserId ? { ...user, name, phoneNumber, email } : user)
    }));
    return { success: true };
  };

  const handleChangePassword = (currentPassword: string, newPassword: string): { success: boolean, error?: string } => {
    if (!currentUser) return { success: false, error: "Not logged in." };
    if (currentUser.password !== currentPassword) {
        return { success: false, error: "Incorrect current password." };
    }
    setAppState(prev => ({
        ...prev,
        users: prev.users.map(user => user.id === prev.currentUserId ? { ...user, password: newPassword } : user)
    }));
    return { success: true };
  };

  const { totalIncome, totalExpense, balance, sortedTransactions } = useMemo(() => {
    const currentTransactions = activeBook?.transactions || [];
    const totalIncome = currentTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + (t.msbDetails?.receivingAmount || t.amount), 0);
    const totalExpense = currentTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;
    const sortedTransactions = [...currentTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { totalIncome, totalExpense, balance, sortedTransactions };
  }, [activeBook]);
  
  const handleRegister = (name: string, phoneNumber: string, email: string, password: string): boolean => {
    if (users.some(user => user.email === email)) return false;
    const defaultBook: Book = { id: crypto.randomUUID(), name: "My First Book", currency: "USD", transactions: [], type: BookType.GENERAL };
    const newUser: User = { id: crypto.randomUUID(), name, phoneNumber, email, password, books: [defaultBook] };
    
    handleNavigation(() => {
        setAppState(prev => ({
            ...prev,
            users: [...prev.users, newUser],
            currentUserId: newUser.id,
            activeBookId: defaultBook.id,
        }));
        setAppContext('GENERAL');
        setActiveView(View.GENERAL_BOOK_LIST);
        sessionStorage.setItem('finebook-currentUser', newUser.id);
    });
    return true;
  };

  const handleLogin = (email: string, password: string): boolean => {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        handleNavigation(() => {
            const firstGeneralBook = user.books.find(b => b.type === BookType.GENERAL);
            setAppState(prev => ({
                ...prev,
                currentUserId: user.id,
                activeBookId: firstGeneralBook?.id || null
            }));
            setAppContext('GENERAL');
            setActiveView(View.GENERAL_BOOK_LIST);
            sessionStorage.setItem('finebook-currentUser', user.id);
        });
        return true;
    }
    return false;
  };

  const handleLogout = () => {
    handleNavigation(() => {
        setAppState(prev => ({...prev, currentUserId: null, activeBookId: null}));
        setActiveView(View.HOME);
        sessionStorage.removeItem('finebook-currentUser');
    });
  };

  const handleShowAddBookModal = (isMsb: boolean) => {
    setAddBookModalIsMsb(isMsb);
    setIsAddBookModalOpen(true);
  };

  const Dashboard = ({ onBackToList }: { onBackToList: () => void; }) => {
    if (!activeBook) {
       // Should not happen due to view logic, but as a fallback:
       return (
        <div className="w-full text-center p-8">
            <h2 className="text-xl font-bold">Book not found</h2>
            <p className="text-slate-500 mt-2">The selected book could not be loaded.</p>
            <button onClick={onBackToList} className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg">Go Back</button>
        </div>
       );
    }
    const isMSBBook = activeBook.type === BookType.MSB;
    return (
        <div className="w-full flex flex-col">
            <header className="py-6 text-center flex-shrink-0 relative">
                 <button
                    onClick={onBackToList}
                    className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors font-medium text-sm p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Back to Books
                </button>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                    <span className="text-indigo-500 dark:text-indigo-400">{activeBook.name}</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                    {isMSBBook ? `Your MSB Remittance Ledger (${activeBook.currency})` : 'Your Smooth & Modern Accounting Companion'}
                </p>
            </header>
            <div className={`mt-8 ${isMSBBook ? 'space-y-8' : 'flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8 items-start'}`}>
                {isMSBBook ? (
                    <>
                        <BalanceSummary balance={balance} income={totalIncome} expense={totalExpense} currency={activeBookCurrency} language={language}/>
                        {isMSBFormOpen ? (
                            <MSBForm onAddTransaction={handleAddMSBTransaction} onCancel={() => setIsMSBFormOpen(false)} currencyPair={activeBookCurrency}/>
                        ) : (
                            <TransactionList transactions={sortedTransactions} onDeleteTransaction={handleDeleteTransaction} onEditTransaction={id => setEditingTransactionId(id)} onUpdateMSBStatus={handleUpdateMSBStatus} currency={activeBookCurrency} language={language} isMSBBook={true} onShowAddMSBForm={() => setIsMSBFormOpen(true)}/>
                        )}
                    </>
                ) : (
                    <>
                        <div className="lg:col-span-2 flex flex-col gap-8">
                            <BalanceSummary balance={balance} income={totalIncome} expense={totalExpense} currency={activeBookCurrency} language={language}/>
                            <TransactionList transactions={sortedTransactions} onDeleteTransaction={handleDeleteTransaction} onEditTransaction={id => setEditingTransactionId(id)} currency={activeBookCurrency} language={language} isMSBBook={false}/>
                        </div>
                        <div className="lg:col-span-1">
                            <TransactionForm onAddTransaction={handleAddTransaction} onDeleteBook={handleDeleteBook} canDeleteBook={generalBooks.length > 1}/>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
  };
  
  const InitialLoadingIndicator = () => (
    <div className="w-full h-full flex items-center justify-center flex-col">
      <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="mt-4 text-slate-500 dark:text-slate-400">Loading your finebook...</p>
    </div>
  );

  const PageLoadingOverlay = () => (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-fast">
        <div className="w-12 h-12 border-4 border-white border-solid border-t-transparent rounded-full animate-spin-fast"></div>
    </div>
  );

  const renderContent = () => {
    if (initialLoading) return <InitialLoadingIndicator />;
    if (!currentUser) {
      switch(activeView) {
        case View.LOGIN: return <Login onLogin={handleLogin} />;
        case View.REGISTER: return <Register onRegister={handleRegister} />;
        case View.PRIVACY_POLICY: return <PrivacyPolicy />;
        case View.TERMS_OF_SERVICE: return <TermsOfService />;
        default: return <Homepage onNavigate={selectView} />;
      }
    }
    switch(activeView) {
      case View.GENERAL_BOOK_LIST:
        return <GeneralBookList generalBooks={generalBooks} onSelectBook={selectBookAndGoToDashboard} onCreateBook={() => handleShowAddBookModal(false)} />;
      case View.DASHBOARD:
        return <Dashboard onBackToList={handleBackToList} />;
      case View.REPORTS:
        return <Reports book={activeBook} currency={activeBookCurrency} language={language} onInitiateExport={initiateExportHandler} />;
      case View.MSB_HOME:
        return <MSBHomepage onCreateMSBBook={() => handleShowAddBookModal(true)} />;
      case View.MSB_BOOK_LIST:
        return <MSBBookList msbBooks={msbBooks} onSelectBook={selectBookAndGoToDashboard} onCreateMSBBook={() => handleShowAddBookModal(true)} />;
      case View.SETTINGS:
        return <Settings language={language} setLanguage={setLanguage} activeBook={activeBook} onUpdateBookCurrency={handleUpdateBookCurrency}/>;
      case View.PROFILE:
        return <Profile currentUser={currentUser} onUpdateProfile={handleUpdateUserProfile} onChangePassword={handleChangePassword}/>;
      case View.PRIVACY_POLICY:
        return <PrivacyPolicy />;
      case View.TERMS_OF_SERVICE:
        return <TermsOfService />;
      default:
        return <GeneralBookList generalBooks={generalBooks} onSelectBook={selectBookAndGoToDashboard} onCreateBook={() => handleShowAddBookModal(false)} />;
    }
  }
  
  const mainContentClass = (activeView === View.LOGIN || activeView === View.REGISTER || initialLoading)
    ? "flex-grow flex"
    : "flex-grow container mx-auto px-4 py-8 max-w-7xl flex";

  return (
    <div className="min-h-screen flex flex-col text-slate-800 dark:text-slate-200 font-sans">
      {isPageLoading && <PageLoadingOverlay />}
      <Navbar 
          currentUser={currentUser}
          activeView={activeView}
          onSelectView={selectView}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
          onMSBNav={handleMSBNav}
          onGeneralNav={handleGeneralNav}
          appContext={appContext}
      />
      <main className={mainContentClass}>
        {renderContent()}
      </main>
      <Footer onNavigate={selectView} currentUser={currentUser} />

      {isAddBookModalOpen && (
        <AddBookModal 
            onSave={handleAddBook} 
            onClose={() => setIsAddBookModalOpen(false)}
            defaultIsMsb={addBookModalIsMsb}
        />
      )}

      {editingTransaction && editingTransaction.category === TransactionCategory.GENERAL && (
        <EditTransactionModal
          transaction={editingTransaction}
          onSave={handleUpdateTransaction}
          onClose={() => setEditingTransactionId(null)}
        />
      )}
      {editingTransaction && editingTransaction.category === TransactionCategory.MSB && (
        <EditMSBTransactionModal
          transaction={editingTransaction}
          onSave={handleUpdateMSBTransaction}
          onClose={() => setEditingTransactionId(null)}
        />
      )}
    </div>
  );
};

const AddBookModal: React.FC<{
  onSave: (name: string, currency: string, isMsb: boolean) => boolean;
  onClose: () => void;
  defaultIsMsb?: boolean;
}> = ({ onSave, onClose, defaultIsMsb = false }) => {
  const [name, setName] = useState('');
  const [isMsb, setIsMsb] = useState(defaultIsMsb);
  const [currency, setCurrency] = useState(defaultIsMsb ? 'CAD-INR' : 'USD');
  const [error, setError] = useState('');

  const generalCurrencies = [
    { code: 'USD', name: 'US Dollar' }, { code: 'EUR', name: 'Euro' }, { code: 'JPY', name: 'Japanese Yen' },
    { code: 'GBP', name: 'British Pound' }, { code: 'AUD', name: 'Australian Dollar' }, { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'CHF', name: 'Swiss Franc' }, { code: 'CNY', name: 'Chinese Yuan' }, { code: 'INR', name: 'Indian Rupee' },
  ];
  const msbCurrencies = [
    { code: 'CAD-INR', name: 'CAD to INR' }, { code: 'INR-CAD', name: 'INR to CAD' },
    { code: 'USD-INR', name: 'USD to INR' }, { code: 'INR-USD', name: 'INR to USD' },
  ];

  const availableCurrencies = isMsb ? msbCurrencies : generalCurrencies;

  useEffect(() => {
    setCurrency(isMsb ? msbCurrencies[0].code : generalCurrencies[0].code);
  }, [isMsb]);


  const handleSave = () => {
    setError('');
    if (!name.trim()) { setError('Book name cannot be empty.'); return; }
    if (name.trim().length < 3 || name.trim().length > 30) { setError('Name must be between 3 and 30 characters.'); return; }
    const success = onSave(name.trim(), currency, isMsb);
    if (success) onClose();
    else setError('A book with this name already exists.');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{isMsb ? 'Create New MSB Book' : 'Create New Book'}</h2>
        <div>
            <label htmlFor="book-name" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Book Name</label>
            <input id="book-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder={isMsb ? "e.g., Canada-India Corridor" : "e.g., Personal Finances"} className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-3" autoFocus />
            {error && <p className="text-rose-500 text-xs mt-1">{error}</p>}
        </div>
        <div>
            <label htmlFor="currency-select" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Currency</label>
            <select id="currency-select" value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-3">
              {availableCurrencies.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
        </div>
        {!defaultIsMsb && (
            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <input id="is-msb-checkbox" type="checkbox" checked={isMsb} onChange={e => setIsMsb(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"/>
                <label htmlFor="is-msb-checkbox" className="text-sm font-medium text-slate-600 dark:text-slate-300">This is an MSB Book (for remittances)</label>
            </div>
        )}
        <div className="flex justify-end gap-4 pt-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-lg">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg">Save</button>
        </div>
      </div>
    </div>
  );
};

export default App;
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Book } from '../storage/BookRepository';
import { useBookRepository, useFileSystem } from '../contexts/BookRepositoryContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Buffer } from 'buffer';
import { TTSControls } from '../components/TTSControls';

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type ReaderScreenRouteProp = RouteProp<RootStackParamList, 'Reader'>;
type ReaderScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Reader'>;

export const ReaderScreen = () => {
  const route = useRoute<ReaderScreenRouteProp>();
  const navigation = useNavigation<ReaderScreenNavigationProp>();
  const bookRepository = useBookRepository();
  const fileSystem = useFileSystem();
  const { bookId } = route.params;
  const insets = useSafeAreaInsets();
  const [book, setBook] = useState<Book | null>(null);
  const [bookBase64, setBookBase64] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [webViewReady, setWebViewReady] = useState(false);
  const webViewRef = useRef<WebView>(null);
  
  // Promise resolver for text extraction
  const textResolverRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => {
    const loadBook = async () => {
      try {
        const bookData = await bookRepository.getBook(bookId);
        if (bookData) {
            setBook(bookData);
            navigation.setOptions({ title: bookData.title });
            
            // Read book as base64 for WebView
            const bytes = await fileSystem.readBytes(bookData.uri);
            const base64 = Buffer.from(bytes).toString('base64');
            setBookBase64(base64);
        }
      } catch (e) {
        console.error('Failed to load book', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadBook();
  }, [bookId, bookRepository, fileSystem, navigation]);

  // Handle messages from WebView
  const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[ReaderScreen WebView]', data);
      
      if (data.type === 'ready') {
        setWebViewReady(true);
      } else if (data.type === 'visibleText' && textResolverRef.current) {
        textResolverRef.current(data.text || '');
        textResolverRef.current = null;
      }
    } catch (e) {
      console.error('Error parsing WebView message:', e);
    }
  }, []);

  // Request text from WebView for TTS
  const requestTextForTTS = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      if (!webViewRef.current || !webViewReady) {
        resolve('');
        return;
      }
      
      textResolverRef.current = resolve;
      
      // Inject JS to get visible text from epub.js
      // epub.js renders content inside iframes, so we need to access them
      webViewRef.current.injectJavaScript(`
        (function() {
          try {
            let text = '';
            
            // epub.js renders content in iframes inside #viewer
            const iframes = document.querySelectorAll('#viewer iframe');
            console.log('[TextExtract] Found iframes:', iframes.length);
            
            if (iframes.length > 0) {
              iframes.forEach((iframe, index) => {
                try {
                  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                  if (iframeDoc && iframeDoc.body) {
                    const iframeText = iframeDoc.body.innerText || iframeDoc.body.textContent || '';
                    text += iframeText + ' ';
                    console.log('[TextExtract] Iframe ' + index + ' text length:', iframeText.length);
                  }
                } catch (e) {
                  console.log('[TextExtract] Could not access iframe:', e.message);
                }
              });
            }
            
            // Fallback: try direct content
            if (!text.trim()) {
              const viewer = document.querySelector('#viewer');
              if (viewer) {
                text = viewer.innerText || viewer.textContent || '';
                console.log('[TextExtract] Fallback viewer text length:', text.length);
              }
            }
            
            console.log('[TextExtract] Total text length:', text.trim().length);
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'visibleText', 
              text: text.trim() 
            }));
          } catch (e) {
            console.log('[TextExtract] Error:', e.message);
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'visibleText', 
              text: '' 
            }));
          }
        })();
        true;
      `);
      
      // Timeout after 2 seconds
      setTimeout(() => {
        if (textResolverRef.current) {
          textResolverRef.current('');
          textResolverRef.current = null;
        }
      }, 2000);
    });
  }, [webViewReady]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!book || !bookBase64) {
    return (
        <View style={styles.center}>
            <Text>Book not found</Text>
        </View>
    );
  }

  // HTML with epub.js loaded from CDN
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js"></script>
      <style>
        body {
          margin: 0;
          padding: 0;
          background: #F4ECD8;
          font-family: Georgia, serif;
        }
        #viewer {
          width: 100%;
          height: 100vh;
          overflow: hidden;
        }
        /* epub.js default rendition styling */
        .epub-container {
          background: #F4ECD8 !important;
        }
      </style>
    </head>
    <body>
      <div id="viewer"></div>
      <script>
        (async function() {
          try {
            // Decode base64 to ArrayBuffer
            const base64 = "${bookBase64}";
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            
            // Initialize epub.js
            const book = ePub(bytes.buffer);
            const rendition = book.renderTo("viewer", {
              manager: "continuous",
              flow: "scrolled",
              width: "100%",
              height: "100%",
              allowScriptedContent: true
            });
            
            // Apply warm paper theme
            rendition.themes.default({
              body: {
                "background-color": "#F4ECD8",
                "color": "#2C221C",
                "font-family": "Georgia, serif",
                "line-height": "1.6",
                "padding": "20px"
              },
              "h1, h2, h3": {
                "color": "#4A3B32"
              },
              "a": {
                "color": "#8B4513",
                "text-decoration": "underline"
              }
            });
            
            // Handle internal link clicks (TOC navigation)
            rendition.on("linkClicked", function(href) {
              console.log("Link clicked via epub.js:", href);
              rendition.display(href);
            });
            
            // Attach click handler to each section as it renders
            rendition.hooks.content.register(function(contents) {
              const doc = contents.document;
              doc.addEventListener("click", function(e) {
                const target = e.target.closest("a");
                if (target) {
                  const href = target.getAttribute("href");
                  if (href && !href.startsWith("http") && !href.startsWith("mailto")) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Internal link clicked:", href);
                    rendition.display(href);
                  }
                }
              }, true);
            });
            
            rendition.display();
            
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
          } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: e.message }));
          }
        })();
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        onMessage={handleWebViewMessage}
        onError={(e) => console.error('WebView error:', e.nativeEvent)}
      />
      <TTSControls onRequestText={requestTextForTTS} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4ECD8',
  },
  webview: {
    flex: 1,
    backgroundColor: '#F4ECD8',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4ECD8',
  },
});

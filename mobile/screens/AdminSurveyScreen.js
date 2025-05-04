import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  TextInput,
  ScrollView
} from 'react-native';
import { apiService } from '../services/apiService';

const AdminSurveyScreen = () => {
  const [questions, setQuestions] = useState([]);
  const [userResponses, setUserResponses] = useState([]);
  const [paretoData, setParetoData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    questionType: 'text',
    options: []
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const fetchedQuestions = await apiService.getQuestions();
      setQuestions(fetchedQuestions);
    } catch (error) {
      console.error('Error fetching questions');
    }
  };

  const fetchUserResponses = async (userId) => {
    try {
      const responses = await apiService.getUserResponses(userId);
      setUserResponses(responses);
    } catch (error) {
      console.error('Error fetching user responses');
    }
  };

  const fetchParetoAnalysis = async () => {
    try {
      const analysis = await apiService.getParetoAnalysis();
      setParetoData(analysis);
    } catch (error) {
      console.error('Error fetching Pareto analysis');
    }
  };

  const createQuestion = async () => {
    try {
      await apiService.createQuestion(newQuestion);
      setModalVisible(false);
      fetchQuestions();
    } catch (error) {
      console.error('Error creating question');
    }
  };

  const renderQuestion = ({ item }) => (
    <View style={styles.questionItem}>
      <Text>{item.text}</Text>
      <Text>Type: {item.questionType}</Text>
      {item.questionType === 'multipleChoice' && (
        <View>
          {item.options.map((option, index) => (
            <Text key={index}>- {option}</Text>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Questions</Text>
        <FlatList
          data={questions}
          renderItem={renderQuestion}
          keyExtractor={(item) => item._id}
        />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>Add Question</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TextInput
            placeholder="Question Text"
            value={newQuestion.text}
            onChangeText={(text) => setNewQuestion(prev => ({...prev, text}))}
            style={styles.input}
          />
          <TouchableOpacity 
            onPress={() => setNewQuestion(prev => ({
              ...prev, 
              questionType: prev.questionType === 'text' ? 'multipleChoice' : 'text'
            }))}
          >
            <Text>Question Type: {newQuestion.questionType}</Text>
          </TouchableOpacity>
          {newQuestion.questionType === 'multipleChoice' && (
            <View>
              {newQuestion.options.map((option, index) => (
                <TextInput
                  key={index}
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChangeText={(text) => {
                    const newOptions = [...newQuestion.options];
                    newOptions[index] = text;
                    setNewQuestion(prev => ({...prev, options: newOptions}));
                  }}
                  style={styles.input}
                />
              ))}
              {newQuestion.options.length < 3 && (
                <TouchableOpacity 
                  onPress={() => setNewQuestion(prev => ({
                    ...prev, 
                    options: [...prev.options, '']
                  }))}
                >
                  <Text>Add Option</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          <TouchableOpacity onPress={createQuestion} style={styles.submitButton}>
            <Text>Create Question</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  questionItem: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 5
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center'
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center'
  }
});

export default AdminSurveyScreen;

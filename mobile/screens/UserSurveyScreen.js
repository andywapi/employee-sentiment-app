import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Alert 
} from 'react-native';
import { apiService } from '../services/apiService';

const UserSurveyScreen = () => {
  const [questions, setQuestions] = useState([]);
  const [userId, setUserId] = useState('');
  const [responses, setResponses] = useState({});

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const fetchedQuestions = await apiService.getQuestions();
      setQuestions(fetchedQuestions);
    } catch (error) {
      Alert.alert('Error', 'Could not fetch questions');
    }
  };

  const handleResponseChange = (questionId, response) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: response
    }));
  };

  const submitSurvey = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please enter your User ID');
      return;
    }

    try {
      const submissionPromises = questions.map(question => {
        const responseData = {
          questionId: question._id,
          userId,
          responseText: question.questionType === 'text' ? responses[question._id] : null,
          selectedOption: question.questionType === 'multipleChoice' ? responses[question._id] : null
        };
        return apiService.submitResponse(responseData);
      });

      await Promise.all(submissionPromises);
      Alert.alert('Success', 'Survey submitted successfully!');
      setResponses({});
    } catch (error) {
      Alert.alert('Error', 'Could not submit survey');
    }
  };

  const renderQuestion = ({ item: question }) => (
    <View style={styles.questionContainer}>
      <Text style={styles.questionText}>{question.text}</Text>
      {question.questionType === 'text' ? (
        <TextInput
          style={styles.textInput}
          placeholder="Your response"
          value={responses[question._id] || ''}
          onChangeText={(text) => handleResponseChange(question._id, text)}
          maxLength={100}
        />
      ) : (
        question.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.radioButton}
            onPress={() => handleResponseChange(question._id, option)}
          >
            <View 
              style={[
                styles.radioCircle,
                responses[question._id] === option && styles.selectedRadio
              ]}
            />
            <Text>{option}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.userIdInput}
        placeholder="Enter User ID"
        value={userId}
        onChangeText={setUserId}
      />
      <FlatList
        data={questions}
        renderItem={renderQuestion}
        keyExtractor={(item) => item._id}
      />
      <TouchableOpacity style={styles.submitButton} onPress={submitSurvey}>
        <Text style={styles.submitButtonText}>Submit Survey</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  userIdInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5
  },
  questionContainer: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 5
  },
  questionText: {
    fontWeight: 'bold',
    marginBottom: 10
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    marginRight: 10
  },
  selectedRadio: {
    backgroundColor: '#000'
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center'
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});

export default UserSurveyScreen;
